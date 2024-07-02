import numpy as np
from flask import Flask, render_template, request,jsonify
from keras.models import load_model
from keras.preprocessing import image
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from sklearn.preprocessing import LabelBinarizer
from flask_cors import CORS  # Import the CORS extension
from werkzeug.utils import secure_filename
import os
import torch
import os
import numpy as np
from app2 import Model,validation_dataset,im_convert,predict,train_transforms

app = Flask(__name__)
CORS(app)


model = load_model('model.h5')

model.make_predict_function()
# threshold=0.5
lb = LabelBinarizer()
lb.classes_ = ['fake','real']

def predict_label(img_path,model):
	image = load_img(img_path, target_size=(224, 224))
	image_array = img_to_array(image)
	image_array = preprocess_input(image_array.reshape(1, 224, 224, 3))
	predictions = model.predict(image_array)
	predicted_class_index = np.argmax(predictions, axis=1)
	predicted_class_label = lb.classes_[predicted_class_index[0]]

	# print("Raw Predictions:", predictions)
    # print("Predicted Class Index:", predicted_class_index)

	return predicted_class_label
	# return predictions
	# return predictions[0][predicted_class_index]
	# return predicted_class_index


# routes
@app.route('/submit/<path:img>', methods=['POST'])
def get_output(img):
	# img = request.files['my_image']
	image = img

	p = predict_label(image,model)
	return {"predict":p,"img_path":image}


@app.route('/vsubmit/<path:vid>', methods=['POST'])
def submitVideo(vid):
    # Check if video file is present in the request
    # return jsonify({'video name': vid})

    # if 'my_video' not in request.files:
    #     return jsonify({'error': 'No video uploaded!'})

    # Get the uploaded video file
    # video_file = request.files['video']
    path_to_videos = vid
    # return jsonify({'path_to_videos': path_to_videos})

    # if path_to_videos.filename == '':
    #     return jsonify({'error': 'No selected file!'})

    # Save the video file temporarily
    # video_filename = 'uploaded_video.mp4'
    # path_to_videos = os.path.join(app.config['UPLOAD_FOLDER'], video_filename)
    # video_file.save(path_to_videos)
    # print("Video file path:", path_to_videos)
    # return jsonify({'path_to_videos': path_to_videos})


    path_to_model = 'D:\Final Project\ZEEFT_2 with video\model_93_acc_100_frames_celeb_FF_data.pt'
    
    # Create validation dataset and load the model
    video_dataset = validation_dataset([path_to_videos], sequence_length=10, transform=train_transforms)
    model = Model(2)
    model.load_state_dict(torch.load(path_to_model, map_location=torch.device('cpu')))
    model.eval()
    
    # Predict and print results
    prediction = predict(model, video_dataset[0])
    print("Prediction:", prediction)
    return {"prediction":prediction[0],"vid_path":path_to_videos}
    # return jsonify({'prediction': prediction[0]})



if __name__ =='__main__':
    app.run(debug=True, port=5000)