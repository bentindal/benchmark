class PlaceBasedBenches < ActiveRecord::Migration[7.1]
  def change
    # Benches become shared places: the FK now records who *discovered* the bench.
    rename_column :benches, :user_id, :discovered_by_id

    # A Visit is a user's contribution to a bench: their photos + an optional rating + a note.
    # Replaces the old `ratings` table and the bench-owned photos. Many visits per user allowed.
    create_table :visits do |t|
      t.bigint :user_id, null: false
      t.bigint :bench_id, null: false
      t.text :note
      t.integer :view_score
      t.integer :comfort_score
      t.integer :location_score
      t.integer :overall_score

      t.timestamps
    end

    add_index :visits, :user_id
    add_index :visits, :bench_id
    add_index :visits, [:bench_id, :created_at]
    add_foreign_key :visits, :users
    add_foreign_key :visits, :benches

    drop_table :ratings do |t|
      t.bigint :user_id, null: false
      t.bigint :bench_id, null: false
      t.integer :view_score, null: false
      t.integer :comfort_score
      t.integer :location_score
      t.integer :overall_score, null: false
      t.timestamps
    end
  end
end
