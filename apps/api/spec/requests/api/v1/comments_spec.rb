require "rails_helper"

RSpec.describe "Comments", type: :request do
  let!(:bench) { create(:bench) }

  describe "POST /api/v1/benches/:bench_id/comments" do
    include_context "authenticated user"

    it "creates a comment when authenticated" do
      expect do
        post "/api/v1/benches/#{bench.id}/comments", params: { body: "Great bench!" }, headers: auth_headers, as: :json
      end.to change(Comment, :count).by(1)
      expect(response).to have_http_status(:created)
    end

    it "returns the comment data with user" do
      post "/api/v1/benches/#{bench.id}/comments", params: { body: "Nice spot" }, headers: auth_headers, as: :json
      expect(json_body["body"]).to eq("Nice spot")
      expect(json_body["user"]["id"]).to eq(user.id)
    end

    it "returns 401 without auth" do
      post "/api/v1/benches/#{bench.id}/comments", params: { body: "No auth" }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 422 for blank body" do
      post "/api/v1/benches/#{bench.id}/comments", params: { body: "" }, headers: auth_headers, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "GET /api/v1/benches/:bench_id/comments" do
    let!(:comments) { create_list(:comment, 3, bench: bench) }

    it "returns paginated comments" do
      get "/api/v1/benches/#{bench.id}/comments"
      expect(response).to have_http_status(:ok)
      expect(json_body).to be_an(Array)
      expect(json_body.length).to eq(3)
    end

    it "returns comments in ascending order" do
      get "/api/v1/benches/#{bench.id}/comments"
      timestamps = json_body.map { |c| Time.parse(c["created_at"]) }
      expect(timestamps).to eq(timestamps.sort)
    end

    it "respects per_page param" do
      get "/api/v1/benches/#{bench.id}/comments", params: { per_page: 2 }
      expect(json_body.length).to eq(2)
    end

    it "includes user data on each comment" do
      get "/api/v1/benches/#{bench.id}/comments"
      expect(json_body.first["user"]).to be_present
    end
  end

  describe "DELETE /api/v1/benches/:bench_id/comments/:id" do
    include_context "authenticated user"

    let!(:own_comment)   { create(:comment, bench: bench, user: user) }
    let!(:other_comment) { create(:comment, bench: bench) }

    it "deletes own comment" do
      expect { delete "/api/v1/benches/#{bench.id}/comments/#{own_comment.id}", headers: auth_headers, as: :json }
        .to change(Comment, :count).by(-1)
      expect(response).to have_http_status(:ok)
    end

    it "returns 403 when deleting another user's comment" do
      delete "/api/v1/benches/#{bench.id}/comments/#{other_comment.id}", headers: auth_headers, as: :json
      expect(response).to have_http_status(:forbidden)
    end

    it "returns 401 without auth" do
      delete "/api/v1/benches/#{bench.id}/comments/#{own_comment.id}", as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
