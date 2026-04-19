class UserSimpleModel {
  final int? id;
  final String? username;

  UserSimpleModel({this.id, this.username});

  factory UserSimpleModel.fromJson(Map<String, dynamic> json) {
    return UserSimpleModel(
      id: json['id'] as int?,
      username: json['username'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'username': username};
  }
}
