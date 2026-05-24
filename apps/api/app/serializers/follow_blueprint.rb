class FollowBlueprint < Blueprinter::Base
  identifier :id
  fields :follower_id, :followed_id
end
