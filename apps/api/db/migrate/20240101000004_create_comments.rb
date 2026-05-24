class CreateComments < ActiveRecord::Migration[7.1]
  def change
    create_table :comments do |t|
      t.bigint :user_id, null: false
      t.bigint :bench_id, null: false
      t.text :body, null: false

      t.timestamps
    end

    add_index :comments, :user_id
    add_index :comments, :bench_id
    add_foreign_key :comments, :users
    add_foreign_key :comments, :benches
  end
end
