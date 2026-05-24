class CreateBenches < ActiveRecord::Migration[7.1]
  def change
    create_table :benches do |t|
      t.string :title, null: false
      t.text :description
      t.decimal :latitude, precision: 10, scale: 7, null: false
      t.decimal :longitude, precision: 10, scale: 7, null: false
      t.string :location_name
      t.bigint :user_id, null: false

      t.timestamps
    end

    add_index :benches, :user_id
    add_index :benches, [:latitude, :longitude]
    add_foreign_key :benches, :users
  end
end
