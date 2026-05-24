Rails.application.routes.draw do
  devise_for :users, path: "", path_names: {
    sign_in: "login",
    sign_out: "logout",
    registration: "signup"
  },
  controllers: {
    sessions: "users/sessions",
    registrations: "users/registrations"
  }

  namespace :api do
    namespace :v1 do
      post   "sign_up",  to: "registrations#sign_up"
      get    "me",       to: "registrations#me"
      post   "sign_in",  to: "sessions#sign_in"
      delete "sign_out", to: "sessions#sign_out"

      resources :benches do
        collection do
          get :nearby
        end
        resources :ratings,  only: [:index, :create, :update]
        resources :comments, only: [:index, :create, :destroy]
      end

      resources :users, only: [:show, :update]
      get "feed", to: "feed#index"
    end
  end

  get "/up", to: "rails/health#show", as: :rails_health_check
end
