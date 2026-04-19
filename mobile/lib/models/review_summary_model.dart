class ReviewSummaryModel {
  final double? averageRating;
  final int? totalReviews;

  final int? fiveStarPercent;
  final int? fourStarPercent;
  final int? threeStarPercent;
  final int? twoStarPercent;
  final int? oneStarPercent;

  ReviewSummaryModel({
    this.averageRating,
    this.totalReviews,
    this.fiveStarPercent,
    this.fourStarPercent,
    this.threeStarPercent,
    this.twoStarPercent,
    this.oneStarPercent,
  });

  factory ReviewSummaryModel.fromJson(Map<String, dynamic> json) {
    return ReviewSummaryModel(
      averageRating: json['averageRating'] != null
          ? (json['averageRating'] as num).toDouble()
          : null,
      totalReviews: json['totalReviews'] as int?,
      fiveStarPercent: json['fiveStarPercent'] as int?,
      fourStarPercent: json['fourStarPercent'] as int?,
      threeStarPercent: json['threeStarPercent'] as int?,
      twoStarPercent: json['twoStarPercent'] as int?,
      oneStarPercent: json['oneStarPercent'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'averageRating': averageRating,
      'totalReviews': totalReviews,
      'fiveStarPercent': fiveStarPercent,
      'fourStarPercent': fourStarPercent,
      'threeStarPercent': threeStarPercent,
      'twoStarPercent': twoStarPercent,
      'oneStarPercent': oneStarPercent,
    };
  }
}
