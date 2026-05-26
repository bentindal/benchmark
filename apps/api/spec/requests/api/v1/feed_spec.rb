require "rails_helper"

RSpec.describe "Feed", type: :request do
  include_context "authenticated user"

  let!(:bench) { create(:bench) }
  let!(:visits) { create_list(:visit, 3, bench: bench) }

  describe "GET /api/v1/feed" do
    it "returns 401 without auth" do
      get "/api/v1/feed"
      expect(response).to have_http_status(:unauthorized)
    end

    it "returns recent visit activity with bench context" do
      get "/api/v1/feed", headers: auth_headers
      expect(response).to have_http_status(:ok)
      expect(json_body).to be_an(Array)
      first = json_body.first
      expect(first).to have_key("photos_urls")
      expect(first["bench"]["id"]).to eq(bench.id)
      expect(first["user"]).to be_present
    end

    it "orders newest first" do
      get "/api/v1/feed", headers: auth_headers
      timestamps = json_body.map { |v| Time.parse(v["created_at"]) }
      expect(timestamps).to eq(timestamps.sort.reverse)
    end
  end
end
