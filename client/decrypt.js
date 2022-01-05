const { Blindnet, util, error } = blindnet;

let path = window.location.pathname.substring(1).split('/');
let user_id = path[0];
let file_name = path[1];

const socket = io.connect('', {query: 'id=' + user_id});

const formDownload = document.getElementById('formDownload');
const buttonDownload = document.getElementById('buttonDownload');

let file_info = null;

socket.on('file_info', (data) => {
    file_info = data;
    buttonDownload.removeAttribute('disabled');
});

formDownload.addEventListener('submit', e => {
   e.preventDefault();

   if(!file_info) return;

   buttonDownload.setAttribute('disabled', '');

   Blindnet
       .deriveSecrets(document.getElementById('inputPassword').value)
       .then(async ({appSecret, blindnetSecret}) => {
          const session = Blindnet.init(file_info.token, 'https://test.blindnet.io');
          await session.connect(blindnetSecret);

          const decrypted = await session.decrypt(file_info.file);

          let blob = new Blob([decrypted.data]);
          let link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = file_name;
          link.click();
       })
       .catch((e) => {
           alert(e.message);
       });
});