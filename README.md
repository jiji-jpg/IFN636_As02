## Flat Management Appllication 
- This web application focuses on supporting property managers by allowing them create, read, update and delete list of property details. After property details is created, tenant details can be added in. 

--- 

### App Access
- Local link: http://localhost:5001 
- Live link: http://13.236.93.10 

- Email: flatadmin@ifn636.com
- Password: flatadmin

### Project links: 
- Jira board: https://connect-team-d4muww5l.atlassian.net/jira/software/projects/TASK/boards/2/timeline?atlOrigin=eyJpIjoiN2I2NTJjZjIwMDRjNGIwZjhmOWIwYWU0OTMzZmIwYjUiLCJwIjoiaiJ9

- EC2 Instance Name + ID: FMA_JC0 [i-0f089ddb0fbe5a343]
- EC2 Instance link: https://ap-southeast-2.console.aws.amazon.com/ec2/home?region=ap-southeast-2#InstanceDetails:instanceId=i-0f089ddb0fbe5a343 

--- 

##  Flat Features

### Flat Details page 
- User can create, read, update and delete flat details. 

### Listing page 
- Presents a list of flat details. 
- User is able to mark vacant or occupied. 
- When marked occupied, user is able to create, read, update and delete tenant details. 

---

##  Project Prerequisites

- [Node.js]
- [GitHub]
- [VSCode]
- [MongoDB]
- [AWS]
- [PuTTy]

--- 

## Project Setup Instructions
1. Clone this repository into your Github
```bash
git clone https://github.com/jiji-jpg/IFN636_As01 
```

2. Web server setup
```bash
sudo apt-get install nginx
sudo service nginx restart all 
```

3. GitHub setup
```bash
sudo ./svc.sh install #if not installed yet
sudo ./svc.sh start #to start the runner 
```

4. Backend setup
```bash
#.env file setup
MONGO_URI=mongodb+srv://FlatAdmin:FlatAdmin@cluster0.qklvjyx.mongodb.net/FlatManagement?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=2J8zqkP7VN6bxzg+Wy7DQZsd3Yx8mF3Bl0kch6HYtFs=
PORT=5001
```

5. Frontend API setup
```bash
#in frontend/src/AxiosConfig.jsx
#for AWS EC2 connection: 
import axios from 'axios';
const axiosInstance = axios.create({
  baseURL: 'http://13.236.93.10', // live
  headers: { 'Content-Type': 'application/json' },
});
export default axiosInstance;

#for local repository connection: 
import axios from 'axios';
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5001', // local
  headers: { 'Content-Type': 'application/json' },
});
export default axiosInstance;
```

6. Dependencies setup 
```bash
#pm2 status check for dependencies
pm2 status
pm2 restart all

#if pm2 status shows nothing 
pm2 start "npm run start" --name="backend" #to start backend
pm2 serve build/ 3000 --name "frontend" --spa #to start frontend 
```

7. Nginx configuration setup
```bash
#check if it is set up
cat /etc/nginx/sites-available/default

#if not, do the following:
sudo nano /etc/nginx/sites-available/default
server {
	server_name _;
	location / {
		proxy_pass http://localhost:3000;
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-for $proxy_add_x_forwarded_for;
	}	
}
```
   
8. You've completed the setups and now you are ready to access the app. The link is provided at the top. 
   
---

## CI/CD Workflows 
### Phase 1: Github and VScode 
1.	Adjusted test file to check all CRUD operations for both features.
	    Created 28 tests covering add flat, get flat, update flat, delete flat, delete image, get public flat, add tenant, get tenant, update     tenant, remove tenant. 
2.	Created .yml file to connect to repository, runner, mongodb and AWS. 
3.	Updated .env file for the connection string to mongodb.

### Phase 2: EC2 terminal
1.	Created an instance named FMA_JC0 on AWS to start EC2 terminal 
2.	Created www folder to deploy web application – the folder will contain static assets. 
3.	Connected to nginx to use to start nginx from the live link.
4.	Connected to GitHub to run website’s content from it. 
5.	Created a github environment to connect to MongoDB for its database. 
6.	Created a github runner to start the website. Once done, start the runner from the terminal. 
7.	For the runner to start properly, run one of the workflow jobs to trigger active. 
8.	After connected, I can see the rest of the directories to start backend and frontend though pm2 commands. 
9.	Check pm2 logs to make sure everything is successful in the background. 
10.	Configure nginx server within the EC2 terminal. 

### Phase 3: VScode
1.	Changed the baseURL in axiosConfig to a public link given from EC2. 

---
### If Website doesn't work: 
1. If page shows 502 bad gateway – make sure runner is active and not idle.
2. Ensure EC2 terminal is online: 
3. re-run the most recent job to have it active again. 
4. If page is connected to MongoDB – ensure that GitHub repository repository’s AxiosConfig.js has the port :5001 defined behind the ip address. However, in local repository, ensure link address is shown without :5001 port listed. Therefore, in AxiosConfig.js it should show http://enter-public-ip instead of http://enter-public-ip:5001. 
5. Every time EC2 address changes, restart and ensure public link is changed accordingly on axiosConfig.jsx. Ensure link is pushed to github. Check that runner is active. Redo and restart pm2 in EC2 terminal. 

--- 
