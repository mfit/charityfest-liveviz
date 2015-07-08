# charityfest-liveviz

Display donations-stats for a charity event using D3, angular, express, socket.io.

## Installation

### Prerequisites

 - NPM / Node
   https://www.npmjs.com/package/npm

 ~~- (Optionally) MongoDB~~
 ~~https://www.mongodb.org/downloadsbower~~

 - Grunt
   http://gruntjs.com/getting-started
   (Install with `npm install -g grunt-cli` on the command line, after npm is installed )

 - Bower http://bower.io/
   (Install with `npm install -g bower` on the command line, after npm is installed )

### Install

 - Checkout / Download the Project
 - Open shell / cmd.exe / Power shell and change into the project folder, then:
   
`npm install`

`bower install`

   With these commands, all necessary packages will be downloaded.

 - Next, start the application  with:

`grunt`


   This will start-up the development server.
   Open the browser at location `http://localhost:1337`
   and `http://localhost:1337/backend` for the live-view and the control panel, respectively.


### Configuration

 - Sessions and projects can be configured (names, etc.) in `PPROJECTFOLDER/data/projects.json` (use a text editor).
 - Donations are kept in `PROJECTFOLDER/data/donations.csv`. If you empty this file, you start from a clean state.
 - CSS / Styling is done in `PROJECTFOLDER/public/css/app.less`








