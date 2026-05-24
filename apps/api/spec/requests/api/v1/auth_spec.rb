require "rails_helper"

RSpec.describe "Auth", type: :request do
  describe "POST /api/v1/sign_up" do
    let(:valid_params) do
      {
        email: "newuser@example.com",
        password: "password123",
        password_confirmation: "password123",
        username: "newuser123"
      }
    end

    it "creates a user" do
      expect { post "/api/v1/sign_up", params: valid_params, as: :json }
        .to change(User, :count).by(1)
    end

    it "returns 201 with a JWT token" do
      post "/api/v1/sign_up", params: valid_params, as: :json
      expect(response).to have_http_status(:created)
      expect(json_body["token"]).to be_present
    end

    it "returns user data" do
      post "/api/v1/sign_up", params: valid_params, as: :json
      user_data = json_body["user"]
      expect(user_data["email"]).to eq("newuser@example.com")
      expect(user_data["username"]).to eq("newuser123")
    end

    it "returns errors for invalid params" do
      post "/api/v1/sign_up", params: { email: "", password: "x" }, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_body["errors"]).to be_present
    end
  end

  describe "POST /api/v1/sign_in" do
    let!(:user) { create(:user, email: "existing@example.com", password: "password123") }

    it "authenticates and returns 200" do
      post "/api/v1/sign_in", params: { email: "existing@example.com", password: "password123" }, as: :json
      expect(response).to have_http_status(:ok)
    end

    it "returns a JWT token" do
      post "/api/v1/sign_in", params: { email: "existing@example.com", password: "password123" }, as: :json
      expect(json_body["token"]).to be_present
    end

    it "returns user data" do
      post "/api/v1/sign_in", params: { email: "existing@example.com", password: "password123" }, as: :json
      expect(json_body["user"]["email"]).to eq("existing@example.com")
    end

    it "returns 401 for wrong password" do
      post "/api/v1/sign_in", params: { email: "existing@example.com", password: "wrongpass" }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 401 for unknown email" do
      post "/api/v1/sign_in", params: { email: "nobody@example.com", password: "password123" }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /api/v1/me" do
    include_context "authenticated user"

    it "returns current user when authenticated" do
      get "/api/v1/me", headers: auth_headers
      expect(response).to have_http_status(:ok)
      expect(json_body["user"]["email"]).to eq(user.email)
    end

    it "returns 401 without auth" do
      get "/api/v1/me", headers: {}
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "DELETE /api/v1/sign_out" do
    include_context "authenticated user"

    it "revokes the token and returns success" do
      delete "/api/v1/sign_out", headers: auth_headers
      expect(response).to have_http_status(:ok)
      expect(json_body["message"]).to be_present
    end

    it "invalidates the token after sign out" do
      delete "/api/v1/sign_out", headers: auth_headers
      get "/api/v1/me", headers: auth_headers
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
