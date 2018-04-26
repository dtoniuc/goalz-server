const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
const admin = require('firebase-admin');
admin.initializeApp();

exports.updateRecommandationRatingTrigger = functions.database.ref('/recommendations/{recId}').onUpdate( (change, context) => {
  
	const resource_id = change.after.child('resource_id').val()
	const user_id = change.after.child('user_id').val()
	const old_rating = change.before.child('rating').val()
	const new_rating = change.after.child('rating').val()
	const reg_time = change.after.child('reqTime').val()
		
	if (old_rating === -100) {
		admin.database().ref(`/users/${user_id}/rating`).once("value", (snapshot) => {
			var user_rating = snapshot.val();
			user_rating = user_rating + new_rating - old_rating
			admin.database().ref(`/users/${user_id}/rating`).set(user_rating)
		});
		
		admin.database().ref(`/resources/${resource_id}`).once("value", (snapshot) => {
			var recommendation_no = snapshot.child('recommendation_no').val();
			var new_recommendation_no = recommendation_no + 1
			
			var rating = snapshot.child('rating').val();
			var resource_rating = (rating * recommendation_no + new_rating) / new_recommendation_no
			admin.database().ref(`/resources/${resource_id}/rating`).set(resource_rating)
			
			var avg_time = snapshot.child('avgReqTime').val();
			var resource_avg_time = reg_time
			if (avg_time !== -1) {
				resource_avg_time = (avg_time * recommendation_no + reg_time) / new_recommendation_no
			}
			admin.database().ref(`/resources/${resource_id}/avgReqTime`).set(resource_avg_time)
			
			admin.database().ref(`/resources/${resource_id}/rating_no`).set(new_recommendation_no)
		});
	}
	else {
		admin.database().ref(`/users/${user_id}/rating`).once("value", (snapshot) => {
			var user_rating = snapshot.val();
			user_rating = user_rating + new_rating - old_rating
			admin.database().ref(`/users/${user_id}/rating`).set(user_rating)
		});
		
		admin.database().ref(`/resources/${resource_id}`).once("value", (snapshot) => {
			var rating = snapshot.child('rating').val();
			var recommendation_no = snapshot.child('recommendation_no').val();
			var resource_rating = rating + (new_rating - old_rating) / recommendation_no
			admin.database().ref(`/resources/${resource_id}/rating`).set(resource_rating)
		});
	}
	
	return null
});
	
exports.deleteGoalTrigger = functions.database.ref('/goals/{goalId}').onDelete( (snapshot, context) => {
	var goal_id = snapshot.key
	
	admin.database().ref("/goals").once("value", (snapshot) => {
		snapshot.forEach( (child_snapshot) => {
			var child_id = child_snapshot.key
			var parent_id = child_snapshot.child('parent_id').val();
			if (parent_id === goal_id){
				admin.database().ref("/goals/" + child_id).remove()
			}
		})	
	});
	
	return null
});

exports.deleteUserTrigger = functions.auth.user().onDelete( (user) => {
	var uid = user.uid;

  // Remove the user from your Realtime Database's /users node.
	admin.database().ref("/users/" + uid).remove()
	
	admin.database().ref("/goals").once("value", (snapshot) => {
		snapshot.forEach( (child_snapshot) => {
			var goal_id = child_snapshot.key
			var user_id = child_snapshot.child('user_id').val();
			if (user_id === uid){
				admin.database().ref("/goals/" + goal_id).remove()
			}
		})	
	});
	
	admin.database().ref("/recommendations").once("value", (snapshot) => {
		snapshot.forEach( (child_snapshot) => {
			var rec_id = child_snapshot.key
			var user_id = child_snapshot.child('user_id').val();
			if (user_id === uid){
				admin.database().ref("/recommendations/" + rec_id).remove()
			}
		})	
	});
	
	admin.database().ref("/user_library").once("value", (snapshot) => {
		snapshot.forEach( (child_snapshot) => {
			var lib_id = child_snapshot.key
			var user_id = child_snapshot.child('user_id').val();
			if (user_id === uid){
				admin.database().ref("/user_library/" + lib_id).remove()
			}
		})	
	});
	
	admin.database().ref("/resources").once("value", (snapshot) => {
		snapshot.forEach( (child_snapshot) => {
			var res_id = child_snapshot.key
			var user_id = child_snapshot.child('user_id').val();
			if (user_id === uid){
				admin.database().ref("/resources/" + res_id + "/user_id").set(null)
			}
		})	
	});
	
	return null
});
	