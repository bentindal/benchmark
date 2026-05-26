class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  has_one_attached :avatar
  has_many :discovered_benches, class_name: "Bench", foreign_key: :discovered_by_id, dependent: :destroy
  has_many :visits, dependent: :destroy
  has_many :benches, through: :visits
  has_many :comments, dependent: :destroy
  has_many :given_follows, class_name: "Follow", foreign_key: :follower_id, dependent: :destroy
  has_many :received_follows, class_name: "Follow", foreign_key: :followed_id, dependent: :destroy
  has_many :following, through: :given_follows, source: :followed
  has_many :followers, through: :received_follows, source: :follower

  validates :username, presence: true, uniqueness: { case_sensitive: false }
end
