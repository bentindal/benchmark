require "rails_helper"

RSpec.describe Bench, type: :model do
  describe "#average_rating" do
    let(:bench) { create(:bench) }

    it "returns a hash with view, comfort, location, and overall keys" do
      result = bench.average_rating
      expect(result).to be_a(Hash)
      expect(result.keys).to match_array([:view, :comfort, :location, :overall])
    end

    it "returns nil values when there are no rated visits" do
      result = bench.average_rating
      expect(result[:view]).to be_nil
      expect(result[:overall]).to be_nil
    end

    it "computes correct averages across visits" do
      create(:visit, bench: bench, view_score: 2, comfort_score: 4, location_score: 3, overall_score: 5)
      create(:visit, bench: bench, view_score: 4, comfort_score: 2, location_score: 1, overall_score: 3)

      result = bench.average_rating
      expect(result[:view]).to eq(3.0)
      expect(result[:comfort]).to eq(3.0)
      expect(result[:location]).to eq(2.0)
      expect(result[:overall]).to eq(4.0)
    end

    it "rounds to one decimal place" do
      create(:visit, bench: bench, view_score: 1, overall_score: 1)
      create(:visit, bench: bench, view_score: 2, overall_score: 2)
      create(:visit, bench: bench, view_score: 2, overall_score: 2)

      result = bench.average_rating
      expect(result[:view]).to eq(1.7)
    end

    it "counts only each user's latest rated visit (one vote per user)" do
      user = create(:user)
      create(:visit, bench: bench, user: user, view_score: 1, overall_score: 1, created_at: 2.days.ago)
      create(:visit, bench: bench, user: user, view_score: 5, overall_score: 5, created_at: 1.day.ago)

      result = bench.average_rating
      expect(result[:overall]).to eq(5.0)
      expect(bench.ratings_count).to eq(1)
    end

    it "ignores unrated (photo-only) visits in the aggregate" do
      create(:visit, bench: bench, view_score: 4, overall_score: 4)
      create(:visit, :unrated, bench: bench)
      expect(bench.ratings_count).to eq(1)
      expect(bench.visits_count).to eq(2)
    end
  end

  describe ".near" do
    # New York City area
    let!(:nyc_bench)    { create(:bench, latitude: 40.7128, longitude: -74.0060) }
    # ~1 km away from NYC bench
    let!(:close_bench)  { create(:bench, latitude: 40.7200, longitude: -74.0060) }
    # Sydney — far away
    let!(:sydney_bench) { create(:bench, latitude: -33.8688, longitude: 151.2093) }

    it "returns benches within the given radius" do
      results = Bench.near(40.7128, -74.0060, 5)
      expect(results).to include(nyc_bench)
      expect(results).to include(close_bench)
    end

    it "excludes benches outside the radius" do
      results = Bench.near(40.7128, -74.0060, 5)
      expect(results).not_to include(sydney_bench)
    end

    it "returns an empty result when no benches are within radius" do
      results = Bench.near(0.0, 0.0, 1)
      expect(results.to_a).to be_empty
    end

    it "includes distance_km in the result" do
      results = Bench.near(40.7128, -74.0060, 5).order("distance_km ASC")
      first = results.first
      expect(first).to respond_to(:distance_km)
      expect(first.distance_km.to_f).to be >= 0
    end
  end
end
