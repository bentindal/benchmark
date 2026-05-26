require "rails_helper"

RSpec.describe "Visits", type: :request do
  let!(:bench) { create(:bench) }
  let(:photo) { fixture_file_upload(Rails.root.join("spec/fixtures/files/test.jpg"), "image/jpeg") }

  describe "POST /api/v1/benches/:bench_id/visits (check-in)" do
    include_context "authenticated user"

    let(:valid_params) { { view_score: 4, overall_score: 5, note: "Lovely", photos: [photo] } }

    it "adds a visit to an existing bench when authenticated" do
      expect { post "/api/v1/benches/#{bench.id}/visits", params: valid_params, headers: auth_headers }
        .to change(Visit, :count).by(1)
      expect(response).to have_http_status(:created)
    end

    it "returns the visit data" do
      post "/api/v1/benches/#{bench.id}/visits", params: valid_params, headers: auth_headers
      expect(json_body["view_score"]).to eq(4)
      expect(json_body["overall_score"]).to eq(5)
      expect(json_body["bench_id"]).to eq(bench.id)
      expect(json_body["user"]["id"]).to eq(user.id)
    end

    it "allows the same user to check in more than once" do
      post "/api/v1/benches/#{bench.id}/visits", params: valid_params, headers: auth_headers
      expect { post "/api/v1/benches/#{bench.id}/visits", params: valid_params, headers: auth_headers }
        .to change(Visit, :count).by(1)
      expect(response).to have_http_status(:created)
    end

    it "returns 401 without auth" do
      post "/api/v1/benches/#{bench.id}/visits", params: valid_params
      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 422 without photos" do
      post "/api/v1/benches/#{bench.id}/visits", params: { view_score: 4, overall_score: 5 }, headers: auth_headers
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "returns 422 for invalid scores" do
      post "/api/v1/benches/#{bench.id}/visits", params: { view_score: 10, overall_score: 0, photos: [photo] }, headers: auth_headers
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "GET /api/v1/benches/:bench_id/visits" do
    let!(:other_visit) { create(:visit, bench: bench) }

    it "returns the bench's visits, newest first" do
      get "/api/v1/benches/#{bench.id}/visits"
      expect(response).to have_http_status(:ok)
      expect(json_body).to be_an(Array)
      expect(json_body.map { |v| v["id"] }).to include(other_visit.id)
    end
  end

  describe "PATCH /api/v1/visits/:id" do
    include_context "authenticated user"

    let!(:own_visit)   { create(:visit, user: user, bench: bench, view_score: 2, overall_score: 2) }
    let!(:other_visit) { create(:visit, bench: bench) }

    it "updates own visit" do
      patch "/api/v1/visits/#{own_visit.id}", params: { view_score: 5, overall_score: 5 }, headers: auth_headers, as: :json
      expect(response).to have_http_status(:ok)
      expect(json_body["view_score"]).to eq(5)
    end

    it "returns 403 when updating another user's visit" do
      patch "/api/v1/visits/#{other_visit.id}", params: { view_score: 5 }, headers: auth_headers, as: :json
      expect(response).to have_http_status(:forbidden)
    end

    it "returns 401 without auth" do
      patch "/api/v1/visits/#{own_visit.id}", params: { view_score: 5 }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "DELETE /api/v1/visits/:id" do
    include_context "authenticated user"

    let!(:own_visit)   { create(:visit, user: user, bench: bench) }
    let!(:other_visit) { create(:visit, bench: bench) }

    it "deletes own visit" do
      expect { delete "/api/v1/visits/#{own_visit.id}", headers: auth_headers, as: :json }
        .to change(Visit, :count).by(-1)
      expect(response).to have_http_status(:ok)
    end

    it "returns 403 when deleting another user's visit" do
      delete "/api/v1/visits/#{other_visit.id}", headers: auth_headers, as: :json
      expect(response).to have_http_status(:forbidden)
    end
  end
end
