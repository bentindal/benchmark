require "rails_helper"

RSpec.describe Visit, type: :model do
  let(:user)  { create(:user) }
  let(:bench) { create(:bench) }

  subject { build(:visit, user: user, bench: bench, view_score: 3, overall_score: 4) }

  describe "score validations" do
    [:view_score, :comfort_score, :location_score, :overall_score].each do |attr|
      describe attr.to_s do
        it "is valid between 1 and 5" do
          (1..5).each do |score|
            subject.public_send("#{attr}=", score)
            expect(subject).to be_valid
          end
        end

        it "allows nil (a visit can be photo-only)" do
          subject.public_send("#{attr}=", nil)
          expect(subject).to be_valid
        end

        it "is invalid outside 1-5" do
          subject.public_send("#{attr}=", 0)
          expect(subject).not_to be_valid
          subject.public_send("#{attr}=", 6)
          expect(subject).not_to be_valid
        end
      end
    end
  end

  describe "photo validations" do
    it "requires at least one photo on create" do
      visit = build(:visit, user: user, bench: bench)
      visit.photos.detach
      expect(visit).not_to be_valid
      expect(visit.errors[:photos]).to include("must have at least one photo")
    end

    it "rejects more than 5 photos" do
      6.times do
        subject.photos.attach(io: StringIO.new("x"), filename: "p.jpg", content_type: "image/jpeg")
      end
      expect(subject).not_to be_valid
      expect(subject.errors[:photos]).to include("can't exceed 5")
    end
  end

  describe "many visits per user per bench" do
    it "allows the same user to visit the same bench more than once" do
      create(:visit, user: user, bench: bench)
      second = build(:visit, user: user, bench: bench)
      expect(second).to be_valid
    end
  end

  describe ".rated" do
    it "excludes visits without an overall_score" do
      rated = create(:visit, bench: bench)
      unrated = create(:visit, :unrated, bench: bench)
      expect(bench.visits.rated).to include(rated)
      expect(bench.visits.rated).not_to include(unrated)
    end
  end
end
