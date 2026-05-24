module AuthHelpers
  def sign_up_user(user_attrs = {})
    attrs = {
      email: Faker::Internet.unique.email,
      password: "password123",
      password_confirmation: "password123",
      username: Faker::Internet.unique.username(specifier: 3..20).gsub(/[^a-zA-Z0-9_]/, "_")
    }.merge(user_attrs)

    post "/api/v1/sign_up", params: attrs, as: :json
    JSON.parse(response.body)["token"]
  end

  def auth_headers(token)
    { "Authorization" => "Bearer #{token}" }
  end

  def json_body
    JSON.parse(response.body)
  end
end

RSpec.shared_context "authenticated user" do
  include AuthHelpers

  let(:user) { create(:user) }
  let(:token) do
    post "/api/v1/sign_in", params: { email: user.email, password: "password123" }, as: :json
    json_body["token"]
  end
  let(:auth_headers) { { "Authorization" => "Bearer #{token}" } }
end
