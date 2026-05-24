class CreateRatings < ActiveRecord::Migration[7.1]
  def change
    create_table :ratings do |t|
      t.bigint :user_id, null: false
      t.bigint :bench_id, null: false
      t.integer :view_score, null: false
      t.integer :comfort_score
      t.integer :location_score
      t.integer :overall_score, null: false

      t.timestamps
    end

    add_index :ratings, :user_id
    add_index :ratings, :bench_id
    add_index :ratings, [:user_id, :bench_id], unique: true
    add_foreign_key :ratings, :users
    add_foreign_key :ratings, :benches
  end
end
