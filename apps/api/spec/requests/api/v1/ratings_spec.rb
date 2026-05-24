require "rails_helper"

RSpec.describe "Ratings", type: :request do
  let!(:bench) { create(:bench) }

  describe "POST /api/v1/benches/:bench_id/ratings" do
    include_context "authenticated user"

    let(:valid_params) { { view_score: 4, overall_score: 5 } }

    it "creates a rating when authenticated" do
      expect { post "/api/v1/benches/#{bench.id}/ratings", params: valid_params, headers: auth_headers, as: :json }
        .to change(Rating, :count).by(1)
      expect(response).to have_http_status(:ok)
    end

    it "returns the rating data" do
      post "/api/v1/benches/#{bench.id}/ratings", params: valid_params, headers: auth_headers, as: :json
      expect(json_body["view_score"]).to eq(4)
      expect(json_body["overall_score"]).to eq(5)
      expect(json_body["bench_id"]).to eq(bench.id)
    end

    it "upserts on re-rate (does not create duplicate)" do
      create(:rating, user: user, bench: bench, view_score: 1, overall_score: 1)
      expect do
        post "/api/v1/benches/#{bench.id}/ratings", params: { view_score: 5, overall_score: 5 }, headers: auth_headers, as: :json
      end.not_to change(Rating, :count)
      expect(json_body["view_score"]).to eq(5)
    end

    it "returns 401 without auth" do
      post "/api/v1/benches/#{bench.id}/ratings", params: valid_params, as: :json
      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 422 for invalid scores" do
      post "/api/v1/benches/#{bench.id}/ratings", params: { view_score: 10, overall_score: 0 }, headers: auth_headers, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "PATCH /api/v1/benches/:bench_id/ratings/:id" do
    include_context "authenticated user"

    let!(:rating) { create(:rating, user: user, bench: bench, view_score: 2, overall_score: 2) }

    it "updates the rating" do
      patch "/api/v1/benches/#{bench.id}/ratings/#{rating.id}", params: { view_score: 5, overall_score: 5 }, headers: auth_headers, as: :json
      expect(response).to have_http_status(:ok)
      expect(json_body["view_score"]).to eq(5)
      expect(json_body["overall_score"]).to eq(5)
    end

    it "returns 401 without auth" do
      patch "/api/v1/benches/#{bench.id}/ratings/#{rating.id}", params: { view_score: 5, overall_score: 5 }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /api/v1/benches/:bench_id/ratings" do
    include_context "authenticated user"

    let!(:other_rating) { create(:rating, bench: bench) }

    it "returns the ratings list" do
      get "/api/v1/benches/#{bench.id}/ratings"
      expect(response).to have_http_status(:ok)
      expect(json_body["ratings"]).to be_an(Array)
    end

    it "includes all ratings for the bench" do
      get "/api/v1/benches/#{bench.id}/ratings"
      ids = json_body["ratings"].map { |r| r["id"] }
      expect(ids).to include(other_rating.id)
    end

    it "includes own rating when authenticated" do
      own_rating = create(:rating, user: user, bench: bench)
      get "/api/v1/benches/#{bench.id}/ratings", headers: auth_headers
      expect(json_body["current_user_rating"]["id"]).to eq(own_rating.id)
    end

    it "does not include current_user_rating key when unauthenticated" do
      get "/api/v1/benches/#{bench.id}/ratings"
      expect(json_body).not_to have_key("current_user_rating")
    end

    it "returns current_user_rating as nil when user has not rated" do
      get "/api/v1/benches/#{bench.id}/ratings", headers: auth_headers
      expect(json_body["current_user_rating"]).to be_nil
    end
  end
end
