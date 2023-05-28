INSERT INTO users (
    username, id_google, token_google, profile_picture, email, firstname, lastname
) VALUES (
    'bontp727', 'u7nbo2nt7p', 'ahsdbdhias8y2uiuy2huihiasdf', 'https://www.google.ca/url?sa=i&url=https%3A%2F%2Fwww.rd.com%2Flist%2Fblack-cat-breeds%2F&psig=AOvVaw1C81DWciATAKkGYyuU9c2g&ust=1678841555147000&source=images&cd=vfe&ved=0CA8QjRxqFwoTCOi93aaa2v0CFQAAAAAdAAAAABAa', 'unbontp727@gmail.com', 'Yedne', 'Nights'
);
INSERT INTO organisations(
    title, description
) VALUES(
    "ChaosBolt Studio", "A video game company behind the title A dying Kingdom, The Last Flower and Beyond your Heart!"
);
INSERT INTO r_users_organisations VALUES(
    1, 1, 0
);
INSERT INTO projects (
    title, description, date_created, date_modified, date_todo, date_end, status, user_creator_id, organisations_id_org
)VALUES (
    "NekoCenter", "A project about a cat rescue center! The website will invite users to report stray cat and we take care of them!", sysdate(), sysdate(), date_add(sysdate(), INTERVAL 5 DAY), NULL, "In Progress", 1, 1
);
INSERT INTO r_users_projects VALUES (
    1, 1, 0
);
INSERT INTO tasks (
    title, description, date_created, date_modified, date_started, date_todo, date_end, status
) VALUES (
    'Write the ending of Act 3, Scene 1', 'The ending of Act 3, Scene 1 needs to be finished before the director comes', sysdate(), NULL, NULL, date_add(sysdate(), INTERVAL 8 DAY), NULL, 'Waiting'
);
INSERT INTO r_users_assigned_tasks VALUES (
    1, 1, 'googletaskid', 0
);
INSERT INTO events(
    TITLE, DATE_START, DATE_END, PROJECTS_ID_PROJECT
) VALUES (
    'Grand opening!!!', DATE_ADD(SYSDATE(), INTERVAL 8 DAY), DATE_ADD(DATE_ADD(SYSDATE(), INTERVAL 8 DAY), INTERVAL 2 HOUR), 1
);
INSERT INTO projects (
    title, description, date_created, date_modified, date_todo, date_end, status, user_creator_id, organisations_id_org
)VALUES (
    "Upon Light", "A multiplayer platformer game about funny lizards", sysdate(), sysdate(), date_add(sysdate(), INTERVAL 5 DAY), NULL, "In Progress", 1, 1
);
INSERT INTO r_users_projects VALUES (
    1, 2, 0
);
INSERT INTO tasks (
    title, description, date_created, date_modified, date_started, date_todo, date_end, status, projects_id_project, user_creator_id
) VALUES (
    'Finish modeling main character', 'Who made the model look like an among us crewmate?', sysdate(), NULL, NULL, date_add(sysdate(), INTERVAL 1 DAY), NULL, 'Waiting', 2, 1
);
INSERT INTO tasks (
    title, description, date_created, date_modified, date_started, date_todo, date_end, status, projects_id_project, user_creator_id
) VALUES (
    'Director', 'Mr. Beast!', sysdate(), NULL, NULL, date_add(sysdate(), INTERVAL 1 DAY), NULL, 'Waiting', 2, 1
);
INSERT INTO r_users_assigned_tasks VALUES (
    1, 2, 'googletaskid', 0
);
INSERT INTO r_users_assigned_tasks VALUES (
    1, 3, 'googletaskid', 0
);
INSERT INTO organisation_invite_link (
	organisations_id_org,
    link,
    remaining_uses,
    limit_date,
    hasPerms
) VALUES(
	1,
    'testlink123',
    1,
    date_add(sysdate(), INTERVAL 1 DAY),
    true
);
