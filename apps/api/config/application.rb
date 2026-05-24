require_relative "boot"
require "rails/all"

Bundler.require(*Rails.groups)

module Api
  class Application < Rails::Application
    config.load_defaults 7.1
    config.api_only = true
    config.active_storage.service = :local
    config.middleware.use ActionDispatch::Session::CookieStore
  end
end
