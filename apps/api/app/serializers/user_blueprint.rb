class UserBlueprint < Blueprinter::Base
  identifier :id

  view :brief do
    fields :username
    field :avatar_url do |user|
      if user.respond_to?(:avatar) && user.avatar.attached?
        Rails.application.routes.url_helpers.rails_blob_url(user.avatar)
      end
    end
  end

  view :normal do
    include_view :brief
    fields :email, :bio, :created_at, :updated_at
    field :benches_count do |user|
      user.benches.count
    end
    field :followers_count do |user|
      user.followers.count
    end
    field :following_count do |user|
      user.following.count
    end
  end
end
