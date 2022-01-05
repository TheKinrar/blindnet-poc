const { Blindnet, util, error } = blindnet;
const socket = io();

const inputFile = document.getElementById('inputFile');
const buttonUpload = document.getElementById('buttonUpload');
const cardShare = document.getElementById('cardShare');
const linkShare = document.getElementById('linkShare');

let user_info = null;

socket.on('user_info', (data) => {
   user_info = data;
   buttonUpload.removeAttribute('disabled');
});

document.getElementById('formUpload').addEventListener('submit', e => {
   e.preventDefault();

   if(!user_info) return;
   if(inputFile.files.length === 0) return;

   buttonUpload.setAttribute('disabled', '');

   Blindnet
       .deriveSecrets(document.getElementById('inputPassword').value)
       .then(async ({appSecret, blindnetSecret}) => {
          const session = Blindnet.init(user_info.token, 'https://test.blindnet.io');
          const tempSession = Blindnet.init(user_info.temp_token, 'https://test.blindnet.io');
          await session.connect(blindnetSecret);

          const raw = await inputFile.files[0].arrayBuffer();
          const encrypted = await tempSession.encrypt(raw);

          socket.emit('upload', encrypted.encryptedData);

          const url = `${window.location.protocol}//${window.location.host}/${user_info.id}/${inputFile.files[0].name}`;
          linkShare.setAttribute('href', url);
          linkShare.innerText = url;
          cardShare.classList.remove('d-none');
       })
       .catch((e) => {
           alert(e.message);
       })
});