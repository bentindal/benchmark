require "rails_helper"

RSpec.describe Rating, type: :model do
  let(:user)  { create(:user) }
  let(:bench) { create(:bench) }

  subject { build(:rating, user: user, bench: bench, view_score: 3, overall_score: 4) }

  describe "validations" do
    describe "view_score" do
      it "is valid with a score between 1 and 5" do
        (1..5).each do |score|
          subject.view_score = score
          expect(subject).to be_valid
        end
      end

      it "is invalid with score 0" do
        subject.view_score = 0
        expect(subject).not_to be_valid
        expect(subject.errors[:view_score]).to be_present
      end

      it "is invalid with score 6" do
        subject.view_score = 6
        expect(subject).not_to be_valid
        expect(subject.errors[:view_score]).to be_present
      end

      it "is invalid when blank" do
        subject.view_score = nil
        expect(subject).not_to be_valid
      end
    end

    describe "overall_score" do
      it "is valid with a score between 1 and 5" do
        (1..5).each do |score|
          subject.overall_score = score
          expect(subject).to be_valid
        end
      end

      it "is invalid with score outside 1-5" do
        subject.overall_score = 0
        expect(subject).not_to be_valid
        subject.overall_score = 6
        expect(subject).not_to be_valid
      end

      it "is invalid when blank" do
        subject.overall_score = nil
        expect(subject).not_to be_valid
      end
    end

    describe "comfort_score" do
      it "allows nil" do
        subject.comfort_score = nil
        expect(subject).to be_valid
      end

      it "is invalid when outside 1-5" do
        subject.comfort_score = 6
        expect(subject).not_to be_valid
      end
    end

    describe "location_score" do
      it "allows nil" do
        subject.location_score = nil
        expect(subject).to be_valid
      end

      it "is invalid when outside 1-5" do
        subject.location_score = 0
        expect(subject).not_to be_valid
      end
    end

    describe "uniqueness of user scoped to bench" do
      it "is invalid when user has already rated the bench" do
        create(:rating, user: user, bench: bench, view_score: 3, overall_score: 3)
        duplicate = build(:rating, user: user, bench: bench, view_score: 4, overall_score: 4)
        expect(duplicate).not_to be_valid
        expect(duplicate.errors[:user_id]).to be_present
      end

      it "is valid when the same user rates a different bench" do
        other_bench = create(:bench)
        create(:rating, user: user, bench: bench, view_score: 3, overall_score: 3)
        second = build(:rating, user: user, bench: other_bench, view_score: 4, overall_score: 4)
        expect(second).to be_valid
      end

      it "is valid when different users rate the same bench" do
        other_user = create(:user)
        create(:rating, user: user, bench: bench, view_score: 3, overall_score: 3)
        second = build(:rating, user: other_user, bench: bench, view_score: 4, overall_score: 4)
        expect(second).to be_valid
      end
    end
  end
end
