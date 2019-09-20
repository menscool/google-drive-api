var FileViewer = (function() {
  // Client ID and API key from the Developer Console
  var CLIENT_ID =
    '516850741751-retdr8ln2dlpmsk5jvmuhphpsmr3o9ti.apps.googleusercontent.com';

  // Array of API discovery doc URLs for APIs used by the quickstart
  var DISCOVERY_DOCS = [
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
  ];

  // Authorization scopes required by the API; multiple scopes can be
  // included, separated by spaces.
  var SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly';

  var authorizeButton = document.getElementById('authorize_button');
  var signoutButton = document.getElementById('signout_button');

  /**
   * Helper function for working with events
   */
  function initMyEventPath(e) {
    var currentEl = e.target;
    e.myPath = [];
    while (currentEl) {
      e.myPath.push(currentEl);
      currentEl = currentEl.parentElement;
    }
    if (e.myPath.indexOf(document) === -1) {
      e.myPath.push(document);
    }
    if (e.myPath.indexOf(window) === -1) {
      e.myPath.push(window);
    }
  }

  /**
   * Extracts list item from nodeList
   */
  function extractDriveItem(list) {
    return list.find(function(el) {
      return el.classList && el.classList.contains('drive-item');
    });
  }

  /**
   * Bind events for handle user interactions
   */
  function bindEvents() {
    // Handle buttons presses
    authorizeButton.addEventListener('click', function() {
      gapi.auth2.getAuthInstance().signIn();
    });
    signoutButton.addEventListener('click', function() {
      gapi.auth2.getAuthInstance().signOut();
      location.reload();
    });

    // Handle item click
    document.addEventListener('click', function(e) {
      var items = document.querySelectorAll('.drive-item.selected'),
        item;
      initMyEventPath(e);
      items.forEach(function(el) {
        el.classList.remove('selected');
      });
      item = extractDriveItem(e.myPath);
      if (item) {
        item.classList.add('selected');
      }
    });
    // Handle double click (open file viewer)
    document.addEventListener('dblclick', function(e) {
      var item;
      initMyEventPath(e);
      item = extractDriveItem(e.myPath);
      if (item) {
        try {
          var data = JSON.parse(item.dataset.driveData);
          window.open(data.webViewLink);
        } catch (e) {
          alert('Произошла ошибка, попробуйте позже');
        }
      }
    });
  }

  /**
   *  Initializes the API client library and sets up sign-in state
   *  listeners.
   */
  function initClient() {
    gapi.client
      .init({
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
      })
      .then(
        function() {
          // Listen for sign-in state changes.
          gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

          // Handle the initial sign-in state.
          updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());

          bindEvents();
        },
        function(error) {
          document.querySelector('.api-message').textContent =
            'An error occurred. Please try again later';
        }
      );
  }

  /**
   *  Called when the signed in status changes, to update the UI
   *  appropriately. After a sign-in, the API is called.
   */
  function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
      authorizeButton.style.display = 'none';
      signoutButton.style.display = 'block';
      listFiles();
      document.querySelector('.api-message').textContent =
        'Your files listed below.';
    } else {
      authorizeButton.style.display = 'block';
      signoutButton.style.display = 'none';
      document.querySelector('.api-message').textContent =
        'Please log in to see your files.';
    }
  }

  /**
   * Append loaded element to the DOM
   */
  function appendElement(data) {
    var parent = document.querySelector('.drive-items');
    var newItem = document.createElement('div');
    newItem.className = 'drive-item';
    newItem.innerHTML = `
  <div class="drive-item-content-preview">
      <img class="image" src="https://drive.google.com/thumbnail?authuser=0&sz=w226&id=${data.id}" alt="${data.name}" />
  </div>
  <div class="drive-item-content-description">
      <div class="badge">
          <img src="${data.iconLink}" alt="${data.name}" />
      </div>
      <div class="text">${data.name}</div>
  </div>
`;
    newItem.dataset.driveData = JSON.stringify(data);
    parent.appendChild(newItem);
  }

  /**
   * Output files
   */
  function listFiles() {
    gapi.client.drive.files
      .list({
        q: "mimeType != 'application/vnd.google-apps.folder'", // doesn't show folders
        pageSize: 10,
        fields: '*'
      })
      .then(function(response) {
        var files = response.result.files;
        if (files && files.length > 0) {
          for (var i = 0; i < files.length; i++) {
            appendElement(files[i]);
          }
        } else {
          document.querySelector('.drive-items').textContent =
            "You haven't any files yet";
        }
      });
  }

  return {
    Init: function() {
      gapi.load('client:auth2', initClient);
    }
  };
})();
