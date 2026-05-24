module Api
  module V1
    class RegistrationsController < ApplicationController
      before_action :require_authentication!, only: [:me]

      def sign_up
        user = User.new(sign_up_params)
        if user.save
          token, _payload = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil)
          response.set_header("Authorization", "Bearer #{token}")
          render json: {
            token: token,
            user: UserBlueprint.render_as_hash(user, view: :normal)
          }, status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def me
        render json: { user: UserBlueprint.render_as_hash(current_user, view: :normal) }
      end

      private

      def sign_up_params
        params.permit(:email, :password, :password_confirmation, :username)
      end
    end
  end
end
