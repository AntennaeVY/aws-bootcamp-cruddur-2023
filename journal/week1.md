# Week 1 — App Containerization

*[Week 1 - Live Stream Video](https://www.youtube.com/watch?v=zJnNe5Nv4tE)*

This week we first learned some [spending considerations](https://www.youtube.com/watch?v=OAMHu1NiYoI) according to AWS CloudTrail and Gitpod/Github Codespaces and container [security considerations](https://www.youtube.com/watch?v=OjZz4D0B-cA)

We started to write some mock features for our app.
First of all we needed to support notifications activities, so we needed to update both the Front-End and the Back-End.

Let's start with mocking our [notification page](/frontend-react-js/src/pages/NotificationsFeedPage.js) and [notification endpoint](/backend-flask/services/notification_activities.py).
We need to update our [docs](/backend-flask/openapi-3.0.yml) too...  

Now we can start to dockerize the whole app environment. First we create the docker images for each end of our app

Front-End Image
![](/_docs/assets/week1/frontend_docker_image.png)
![](/_docs/assets/week1/frontend_docker_build.png)

Back-End Image
![](/_docs/assets/week1/backend_docker_image.png)
![](/_docs/assets/week1/backend_docker_build.png)
![](/_docs/assets/week1/backend_docker_run.png)

We create a PostgreSQL and DynamoDB local containers and ensure they're working properly

PostgreSQL
![](/_docs/assets/week1/postgres_local.png)

DynamoDB Local
![](/_docs/assets/week1/dynamodb_local.png)


Then we create a `docker-compose.yml` file to be able to set them up in a network along with databases

Docker Compose Architecture & Diagram
![](/_docs/assets/week1/docker-compose.png)
![](/_docs/assets/week1/docker-compose_diagram.png)