# Summary
This describes how to run a custom version of the Data Explorer in the Emulator which can open a jupyter notebook from with a tab.

# Requirements
This requires:
* a running instance of CosmosDB Emulator
* a running instance of the jupyter server
* access to the cosmosdb-dataexplorer git repository

# Installation
## Install CosmosDB Emulator
* Download from https://docs.microsoft.com/en-us/azure/cosmos-db/local-emulator
* Open the Emulator and create at least one Collection

## Install Jupyter server on local machine (Windows)
We use the Anaconda distribution which comes with a packaged jupyter and python.
* Download and install Anaconda from https://www.anaconda.com/distribution/ (python3 64-bit version)
  Keep all default options. Install Visual Studio Code as well.
### Verify Jupyter installation and create mynotebook
* Open an "Anaconda Prompt" (hit the Window key, type "Anaconda", select "Anaconda Prompt" hit Enter)
> cd src/jupyter-server (the notebooks will be saved in this directory)
> jupyter notebook
* It should open the browser at http://localhost:8888/ with the jupyter notebook.
* Edit the notebook and save it as "mynotebook" (This should create a file: mynotebook.ipynb).
  We do this, because right now, the notebook filename is hardcoded as mynotebook.

### Modify jupyter server install
In order to serve the jupyter frontend from the emulator, we need to turn off a bunch of things.
* Stop the jupyter server (Ctrl-C twice from the Anaconda Prompt where you started jupyter notebook)
* From the Anaconda Prompt, type: juypter notebook --generate-config
* This should create the file: .jupyter/jupyter_notebook in your home directory.
* Edit this file:

Enable embedding the jupyter frontend inside an iFrame in DataExplorer:
c.NotebookApp.tornado_settings = { 'headers': { 'Content-Security-Policy': "frame-ancestors * localhost:1234 localhost:12900"} }

Enable a remotely-served jupyter frontend to still talk to the jupyter server:
c.NotebookApp.allow_origin = '*'
c.NotebookApp.allow_remote_access = True <--- not sure if this one matters
c.NotebookApp.token = ''
c.NotebookApp.disable_check_xsrf = True

## Install custom Data Explorer in Emulator
* Install git from https://git-scm.com/download/win (keep all default options)
* Install nodejs and npm from: https://nodejs.org/en/ (10.15.1 LTS)

### Download and build Data Explorer
* From the Git Bash terminal:
* cd ~/src
* git clone https://msdata.visualstudio.com/DefaultCollection/CosmosDB/_git/cosmosdb-dataexplorer
* cd cosmosdb-dataexplorer/Product/Portal
* git checkout users/languye/spark-in-dataexplorer
* cd JupyterLab
* npm i
* npm run build (this builds jupyterlab (the frontend of jupyter) and copies it into ../DataExplorer/notebookapp/)
* cd ../DataExplorer
* npm i
* npm run build (this builds and copies DataExplorer into the Emulator folder)

# How to run the setup
* Run the jupter-server by opening an Anaconda Prompt and typing: jupyter notebook
* Open the emulator at: http://localhost:8081/_explorer/index.html
* Click on any Collection
* Click on "New Notebook" button in the Command bar
* You should see the "mynotebook" jupyter notebook displayed in tab (inside an iframe).
* There is a "New Cell" button in the CommandBar outside the jupyter iframe which will add a cell inside the notebook.

# Notes
* The iframe in the Data Explorer Tab loads jupyter with the server and notebook pathname passed in the query parameters (they're hardcoded right now):
cosmosdb-dataexplorer/Product/Portal/DataExplorer/src/Explorer/Tabs/NotebookTab.html
* The Emulator is located in: C:\Program Files\Azure Cosmos DB Emulator\Packages\DataExplorer
* Running "jupyter notebook" serves the jupyter traditional frontend. There is an alternate frontend also developed by jupyter which is modular and customizable called: JupyterLab. We use their "notebook" example in this project slightly modified to pass the server and notebook pathname via iframe url's parameters:
https://github.com/jupyterlab/jupyterlab/tree/master/examples/notebook
jupyterlab uses the same communication protocol as the traditional frontend, so it can connect to any jupyter-server,
so one can use multiple frontends (at the same time) to connect to a given jupyter-server.
* The jupyter frontend and the server use websockets to communicate.
