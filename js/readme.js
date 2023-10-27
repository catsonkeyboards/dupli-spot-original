fetch('README.md')
  .then(response => response.text())
  .then(text => {
    const readmeContent = document.getElementById('readme-content');
    readmeContent.innerHTML = marked(text);
  })
  .catch(error => {
    console.error('Error loading README:', error);
  });
