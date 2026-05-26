require "rails_helper"

RSpec.describe "Benches", type: :request do
  describe "GET /api/v1/benches" do
    let!(:benches) { create_list(:bench, 3) }

    it "returns a paginated list of benches" do
      get "/api/v1/benches"
      expect(response).to have_http_status(:ok)
      expect(json_body).to be_an(Array)
      expect(json_body.length).to eq(3)
    end

    it "respects per_page parameter" do
      get "/api/v1/benches", params: { per_page: 2 }
      expect(json_body.length).to eq(2)
    end

    it "accepts ?sort=top_rated" do
      rated_bench = benches.first
      create(:visit, bench: rated_bench, overall_score: 5, view_score: 5)

      get "/api/v1/benches", params: { sort: "top_rated" }
      expect(response).to have_http_status(:ok)
      expect(json_body.first["id"]).to eq(rated_bench.id)
    end

    it "defaults to recent sort" do
      get "/api/v1/benches"
      ids = json_body.map { |b| b["id"] }
      expect(ids).to eq(benches.sort_by(&:created_at).reverse.map(&:id))
    end

    it "exposes the discoverer and visit count" do
      get "/api/v1/benches"
      expect(json_body.first).to have_key("discoverer")
      expect(json_body.first).to have_key("visits_count")
    end
  end

  describe "GET /api/v1/benches/:id" do
    let!(:bench) { create(:bench) }
    let!(:visit) { create(:visit, bench: bench) }
    let!(:comment) { create(:comment, bench: bench) }

    it "returns bench detail" do
      get "/api/v1/benches/#{bench.id}"
      expect(response).to have_http_status(:ok)
      expect(json_body["bench"]["id"]).to eq(bench.id)
    end

    it "includes visits" do
      get "/api/v1/benches/#{bench.id}"
      expect(json_body["visits"]).to be_an(Array)
      expect(json_body["visits"].first["id"]).to eq(visit.id)
    end

    it "includes comments" do
      get "/api/v1/benches/#{bench.id}"
      expect(json_body["comments"]).to be_an(Array)
      expect(json_body["comments"].first["id"]).to eq(comment.id)
    end

    it "returns 404 for missing bench" do
      get "/api/v1/benches/99999999"
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/benches" do
    include_context "authenticated user"

    let(:photo) { fixture_file_upload(Rails.root.join("spec/fixtures/files/test.jpg"), "image/jpeg") }
    let(:valid_params) do
      {
        title: "Central Park Bench",
        description: "A lovely bench",
        latitude: 40.7829,
        longitude: -73.9654,
        location_name: "Central Park, NYC",
        overall_score: 5,
        view_score: 4,
        note: "First find!",
        photos: [photo]
      }
    end

    it "creates a bench and its first visit when authenticated" do
      expect { post "/api/v1/benches", params: valid_params, headers: auth_headers }
        .to change(Bench, :count).by(1).and change(Visit, :count).by(1)
      expect(response).to have_http_status(:created)
    end

    it "records the current user as the discoverer" do
      post "/api/v1/benches", params: valid_params, headers: auth_headers
      expect(json_body["discoverer"]["id"]).to eq(user.id)
    end

    it "returns 401 without auth" do
      post "/api/v1/benches", params: valid_params
      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 422 for invalid params" do
      post "/api/v1/benches", params: { title: "", photos: [photo] }, headers: auth_headers
      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_body["errors"]).to be_present
    end

    it "rejects creation without photos and persists nothing" do
      expect do
        post "/api/v1/benches", params: { title: "No Photo", latitude: 51.5, longitude: -0.1 }, headers: auth_headers
      end.to change(Bench, :count).by(0).and change(Visit, :count).by(0)
      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_body["errors"]).to include("Photos must have at least one photo")
    end
  end

  describe "PATCH /api/v1/benches/:id" do
    include_context "authenticated user"

    let!(:own_bench) { create(:bench, discoverer: user) }
    let!(:other_bench) { create(:bench) }

    it "updates own (discovered) bench" do
      patch "/api/v1/benches/#{own_bench.id}", params: { title: "Updated Title" }, headers: auth_headers, as: :json
      expect(response).to have_http_status(:ok)
      expect(json_body["title"]).to eq("Updated Title")
    end

    it "returns 403 when updating another user's bench" do
      patch "/api/v1/benches/#{other_bench.id}", params: { title: "Hacked" }, headers: auth_headers, as: :json
      expect(response).to have_http_status(:forbidden)
    end

    it "returns 401 without auth" do
      patch "/api/v1/benches/#{own_bench.id}", params: { title: "No auth" }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "DELETE /api/v1/benches/:id" do
    include_context "authenticated user"

    let!(:own_bench) { create(:bench, discoverer: user) }
    let!(:other_bench) { create(:bench) }

    it "deletes own (discovered) bench" do
      expect { delete "/api/v1/benches/#{own_bench.id}", headers: auth_headers, as: :json }
        .to change(Bench, :count).by(-1)
      expect(response).to have_http_status(:ok)
    end

    it "returns 403 when deleting another user's bench" do
      delete "/api/v1/benches/#{other_bench.id}", headers: auth_headers, as: :json
      expect(response).to have_http_status(:forbidden)
    end

    it "returns 401 without auth" do
      delete "/api/v1/benches/#{own_bench.id}", as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /api/v1/benches/nearby" do
    # NYC coordinates
    let!(:nearby_bench) { create(:bench, latitude: 40.7128, longitude: -74.0060) }
    # Sydney — far away
    let!(:far_bench)    { create(:bench, latitude: -33.8688, longitude: 151.2093) }

    it "returns nearby benches" do
      get "/api/v1/benches/nearby", params: { lat: 40.7130, lng: -74.0065, radius: 1 }
      expect(response).to have_http_status(:ok)
      ids = json_body.map { |b| b["id"] }
      expect(ids).to include(nearby_bench.id)
    end

    it "does not include far-away benches" do
      get "/api/v1/benches/nearby", params: { lat: 40.7130, lng: -74.0065, radius: 1 }
      ids = json_body.map { |b| b["id"] }
      expect(ids).not_to include(far_bench.id)
    end

    it "returns empty array when nothing is within radius" do
      get "/api/v1/benches/nearby", params: { lat: 0.0, lng: 0.0, radius: 1 }
      expect(response).to have_http_status(:ok)
      expect(json_body).to eq([])
    end

    it "returns 400 when lat/lng are missing" do
      get "/api/v1/benches/nearby"
      expect(response).to have_http_status(:bad_request)
    end
  end
end
