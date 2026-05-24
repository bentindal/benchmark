module Api
  module V1
    class UsersController < ApplicationController
      before_action :require_authentication!, only: [:update]
      before_action :set_user

      def show
        benches = paginate(@user.benches.recent.includes(:ratings, :comments, photos_attachments: :blob))
        render json: {
          user: UserBlueprint.render_as_hash(@user, view: :normal),
          benches: BenchBlueprint.render_as_hash(benches)
        }
      end

      def update
        return render json: { error: "Forbidden" }, status: :forbidden unless @user.id == current_user.id

        if @user.update(user_params)
          @user.avatar.attach(params[:avatar]) if params[:avatar] && @user.respond_to?(:avatar)
          render json: { user: UserBlueprint.render_as_hash(@user, view: :normal) }
        else
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_user
        @user = User.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "User not found" }, status: :not_found
      end

      def user_params
        params.permit(:username, :bio)
      end
    end
  end
end
