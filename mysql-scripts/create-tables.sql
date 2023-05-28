DROP TABLE IF EXISTS r_users_organisations;
DROP TABLE IF EXISTS r_users_projects;
DROP TABLE IF EXISTS r_users_assigned_tasks;
DROP TABLE IF EXISTS r_users_events;
DROP TABLE IF EXISTS organisation_invite_link;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS organisations;

CREATE TABLE events (
    id_event            DOUBLE PRIMARY KEY AUTO_INCREMENT,
    title               VARCHAR(100) NOT NULL,
    date_start          VARCHAR(100) NOT NULL,
    date_end            VARCHAR(100) NOT NULL,
    projects_id_project DOUBLE
);

CREATE TABLE organisations (
    id_org      DOUBLE PRIMARY KEY AUTO_INCREMENT,
    title       VARCHAR(100) NOT NULL,
    description VARCHAR(1000)
);

CREATE TABLE organisation_invite_link (
    id_link     			DOUBLE PRIMARY KEY AUTO_INCREMENT,
	organisations_id_org 	DOUBLE,
    link					VARCHAR(100) NOT NULL,
    remaining_uses			DOUBLE,
    limit_date				VARCHAR(100),
    hasPerms                BOOLEAN
);

CREATE TABLE projects (
    id_project    DOUBLE PRIMARY KEY AUTO_INCREMENT,
    title         VARCHAR(100) NOT NULL,
    description   VARCHAR(1000),
    date_created  DATETIME NOT NULL,
    date_started  DATETIME,
    date_modified DATETIME,
    date_todo     DATETIME,
    date_end      DATETIME,
    status        VARCHAR(100) NOT NULL,
    user_creator_id DOUBLE,
    organisations_id_org DOUBLE
);

CREATE TABLE r_users_organisations (
    id_user DOUBLE NOT NULL,
    id_org  DOUBLE NOT NULL,
    is_owner BOOLEAN
);

ALTER TABLE r_users_organisations ADD CONSTRAINT r_users_organisations_pk PRIMARY KEY ( id_user,
                                                                                        id_org );
CREATE TABLE r_users_projects (
    id_user    DOUBLE NOT NULL,
    id_project DOUBLE NOT NULL,
    is_owner BOOLEAN
);

ALTER TABLE r_users_projects ADD CONSTRAINT r_users_projects_pk PRIMARY KEY ( id_user,
                                                                              id_project );

CREATE TABLE r_users_assigned_tasks(
    id_user    DOUBLE NOT NULL,
    id_task DOUBLE NOT NULL,
    google_task_id VARCHAR(100),
    is_owner BOOLEAN
);

CREATE TABLE r_users_events(
    id_user  DOUBLE NOT NULL,
    id_event DOUBLE NOT NULL,
    google_event_id VARCHAR(200)
);

-- ALTER TABLE r_users_assigned_tasks ADD CONSTRAINT r_users_assigned_tasks_pk PRIMARY KEY ( id_user, id_task );

CREATE TABLE tasks (
    id_task             DOUBLE PRIMARY KEY AUTO_INCREMENT,
    title               VARCHAR(100) NOT NULL,
    description         VARCHAR(1000),
    date_created        DATETIME NOT NULL,
    date_modified       DATETIME,
    date_started        DATETIME,
    date_todo           DATETIME,
    date_end            DATETIME,
    status              VARCHAR(100) NOT NULL,
    projects_id_project DOUBLE,
    user_creator_id     DOUBLE
);

CREATE TABLE users (
    id_user      DOUBLE PRIMARY KEY AUTO_INCREMENT,
    username     VARCHAR(100) NOT NULL,
    id_google    VARCHAR(50),
    token_google VARCHAR(1000),
    profile_picture VARCHAR(1000),
    email           VARCHAR(727),
    firstname       VARCHAR(100),
    lastname        VARCHAR(100)
);

ALTER TABLE r_users_organisations
    ADD CONSTRAINT r_users_organisations_organisations_fk FOREIGN KEY ( id_org )
        REFERENCES organisations ( id_org );

ALTER TABLE r_users_organisations
    ADD CONSTRAINT r_users_organisations_users_fk FOREIGN KEY ( id_user )
        REFERENCES users ( id_user );

ALTER TABLE r_users_projects
    ADD CONSTRAINT r_users_projects_projects_fk FOREIGN KEY ( id_project )
        REFERENCES projects ( id_project );

ALTER TABLE r_users_projects
    ADD CONSTRAINT r_users_projects_users_fk FOREIGN KEY ( id_user )
        REFERENCES users ( id_user );
        
ALTER TABLE r_users_assigned_tasks
    ADD CONSTRAINT r_users_assigned_tasks_users_fk FOREIGN KEY ( id_task )
        REFERENCES tasks ( id_task );

ALTER TABLE r_users_assigned_tasks
    ADD CONSTRAINT r_users_assigned_task_users_fk FOREIGN KEY ( id_user )
        REFERENCES users ( id_user );

ALTER TABLE r_users_events
    ADD CONSTRAINT r_users_events_events_fk FOREIGN KEY ( id_event )
        REFERENCES events ( id_event );

ALTER TABLE r_users_events
    ADD CONSTRAINT r_users_events_users_fk FOREIGN KEY ( id_user )
        REFERENCES users ( id_user );

ALTER TABLE projects
    ADD CONSTRAINT projets_organisations_fk FOREIGN KEY ( organisations_id_org )
        REFERENCES organisations ( id_org );

ALTER TABLE projects
    ADD CONSTRAINT projects_users_fk FOREIGN KEY (user_creator_id)
        REFERENCES users (id_user);

ALTER TABLE tasks
    ADD CONSTRAINT tasks_users_fk FOREIGN KEY (user_creator_id)
        REFERENCES users (id_user);

ALTER TABLE organisation_invite_link
    ADD CONSTRAINT invite_organisation_fk FOREIGN KEY (organisations_id_org)
        REFERENCES organisations (id_org);