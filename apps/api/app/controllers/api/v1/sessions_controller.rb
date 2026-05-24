module Api
  module V1
    class SessionsController < ApplicationController
      before_action :require_authentication!, only: [:sign_out]

      def sign_in
        user = User.find_by(email: params[:email])
        if user&.valid_password?(params[:password])
          token, _payload = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil)
          response.set_header("Authorization", "Bearer #{token}")
          render json: {
            token: token,
            user: UserBlueprint.render_as_hash(user, view: :normal)
          }
        else
          render json: { error: "Invalid email or password" }, status: :unauthorized
        end
      end

      def sign_out
        current_user.update!(jti: SecureRandom.uuid)
        render json: { message: "Signed out successfully" }
      end
    end
  end
end
