class UserBlueprint < Blueprinter::Base
  identifier :id
  fields :email, :created_at, :updated_at

  view :brief do
    fields :username
    field :avatar_url do |user|
      nil
    end
  end

  view :normal do
    include_view :brief
    fields :bio
  end
end
