module Api
  module V1
    class CommentsController < ApplicationController
      before_action :set_bench
      before_action :require_authentication!, only: [:create, :destroy]
      before_action :set_comment, only: [:destroy]
      before_action :authorize_owner!, only: [:destroy]

      def index
        comments = paginate(@bench.comments.includes(:user).order(created_at: :asc))
        render json: CommentBlueprint.render_as_hash(comments)
      end

      def create
        comment = @bench.comments.build(comment_params.merge(user: current_user))
        if comment.save
          render json: CommentBlueprint.render_as_hash(comment), status: :created
        else
          render json: { errors: comment.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @comment.destroy
        render json: { message: "Comment deleted successfully" }
      end

      private

      def set_bench
        @bench = Bench.find(params[:bench_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Bench not found" }, status: :not_found
      end

      def set_comment
        @comment = @bench.comments.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Comment not found" }, status: :not_found
      end

      def authorize_owner!
        render json: { error: "Forbidden" }, status: :forbidden unless @comment.user_id == current_user.id
      end

      def comment_params
        params.permit(:body)
      end
    end
  end
end
