module Api
  module V1
    class ApplicationController < ::ApplicationController
      skip_before_action :authenticate_user!, raise: false
      before_action :set_current_user

      private

      def set_current_user
        header = request.headers["Authorization"]
        return unless header&.start_with?("Bearer ")

        token = header.split(" ").last
        @current_user = Warden::JWTAuth::UserDecoder.new.call(token, :user, nil)
      rescue JWT::DecodeError, Warden::JWTAuth::Errors::RevokedToken
        @current_user = nil
      end

      def current_user
        @current_user
      end

      def require_authentication!
        render json: { error: "Unauthorized" }, status: :unauthorized unless current_user
      end

      def pagination_params
        page     = [params[:page].to_i,     1].max
        per_page = [[params[:per_page].to_i, 1].max, 100].min
        per_page = 20 if params[:per_page].blank?
        { page: page, per_page: per_page }
      end

      def paginate(scope)
        pp = pagination_params
        scope.offset((pp[:page] - 1) * pp[:per_page]).limit(pp[:per_page])
      end
    end
  end
end
