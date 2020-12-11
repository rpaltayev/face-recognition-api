const axios = require('axios');
const subscriptionKey = 'f8b4e1b13704445fb0bf83d5d7aad3ee';
const rootPath = 'https://nau-capstone-project-face-detection.cognitiveservices.azure.com/face/v1.0';
const defaultHeader = {
  'Ocp-Apim-Subscription-Key': subscriptionKey
}
const defaultRecognitionModel = 'recognition_03';

const handleIdentify = (req, res) => {
  const { url, groupId } = req.body;

  detect({ url })
    .then((response) => {
      const requestBody = {
        faceIds: [response.faceId],
        personGroupId: groupId,
        confidenceThreshold: 0.5,
      }
      identify(requestBody)
        .then(response => {
          res.json(response);
        })
        .catch(() => {
          res.status(500).json({
            error: 'Could not identify a person!'
          })
        })
    })
    .catch(() => res.status(500).json({
      error: 'Could not detect a face to identify!'
    }));
}

const handleAddPerson = (req, res) => {
  const { groupId, personName, personFaces } = req.body;
  addPerson(groupId, personName)
    .then(({ personId }) => {
      const promiseList = []
      personFaces.forEach(url => {
        promiseList.push(addFace(groupId, personId, url));
      })
      Promise.all(promiseList)
        .then(() => {
          initiateTrainGroup(groupId)
            .then(() => {
              res.json({
                personId: personId,
                persistedFaceIds: [],
                name: personName
              })
            })
            .catch(() => {
              res.status(500).json({
                error: 'Something went wrong while initiating a training!'
              });
            });
        })
        .catch(() => {
          res.status(500).json({
            error: 'Was not able to add all the faces! Check if there are more than one face in the photos!'
          });
        });
    })
    .catch((error) => {
      res.status(500).json({
        error: 'Could NOT add a person!'
      });
    });
}

const handleAddFaces = (req, res) => {
  const { groupId, personId, personFaces } = req.body;

  const promiseList = [];
  personFaces.forEach(url => {
    promiseList.push(addFace(groupId, personId, url));
  });

  Promise.all(promiseList)
    .then(() => {
      initiateTrainGroup(groupId)
        .then(() => {
          res.json({
            personId: personId,
            persistedFaceIds: [],
          })
        })
        .catch((error) => {
          res.status(500).json({
            error: 'Something went wrong while initiating a training!'
          });
        });
  })
  .catch(() => {
    res.status(500).json({
      error: 'Was not able to add all the faces! Check if there are more than one face in the photos!'
    });
  });
}

const addPerson = ( groupId, personName ) => {
  const createPersonPath = `${rootPath}/persongroups/${groupId}/persons`;

  const requestBody = {
    name: personName,
  }
  return axios({
    method: 'post',
    url: createPersonPath,
    data: requestBody,
    headers: defaultHeader,
  }).then((response) => Promise.resolve(response.data))
  .catch(error => Promise.reject(error));
}

const getPersons = (groupId) => {
  const getPath = `${rootPath}/persongroups/${groupId}/persons`;

  return axios({
    method: 'get',
    url: getPath,
    headers: defaultHeader,
  }).then((response) => Promise.resolve(response.data))
  .catch(error => Promise.reject(error));
}

const addFace = ( groupId, personId, url ) => {
  const createFacePath = `${rootPath}/persongroups/${groupId}/persons/${personId}/persistedFaces`;
  const requestBody = {
    url
  }

  return axios({
    method: 'post',
    url: createFacePath,
    data: requestBody,
    headers: defaultHeader,
  }).then((response) => Promise.resolve(response.data))
  .catch(error => Promise.reject(error));
}

const initiateTrainGroup = (groupId) => {
  const trainPath = `${rootPath}/persongroups/${groupId}/train`;

  return axios({
    method: 'post',
    url: trainPath,
    headers: defaultHeader
  })
  .then(() => Promise.resolve())
  .catch((error) => Promise.reject(error));
}

const identify = (requestBody) => {
  const identifyPath = rootPath + '/identify';
  return axios({
    method: 'post',
    url: identifyPath,
    data: requestBody,
    headers: defaultHeader
  }).then((response) => {
    if (response.data.lenght === 0) {
      return Promise.resolve({});
    }
    return Promise.resolve(response.data[0])
  }).catch(error => {
    return Promise.reject(error);
  })
}

const detect = (requestBody) => {
  const detectPath = rootPath + '/detect';
  return axios({
    method: 'post',
    url: detectPath,
    params: {
      detectionModel: 'detection_02',
      recognitionModel: defaultRecognitionModel,
      returnFaceId: true
    },
    data: requestBody,
    headers: defaultHeader
  }).then((response) => {
      if (response.data.length === 0) {
        return Promise.resolve({});
      }
      return Promise.resolve(response.data[0]);
  }).catch(error => {
    return Promise.reject(error);
  })
}

const createGroup = ({name, groupId}) => {
  const createPath = `${rootPath}/persongroups/${groupId}`;
  const requestBody = {
    name: 'Suspicious group of persons for ' + name,
    recognitionModel: defaultRecognitionModel,
  }

  return axios({
    method: 'put',
    url: createPath,
    data: requestBody,
    headers: defaultHeader
  }).then(() => Promise.resolve())
  .catch(error => Promise.reject(error))
}


module.exports = {
  handleIdentify,
  handleAddPerson,
  createGroup,
  getPersons,
  handleAddFaces,
}
