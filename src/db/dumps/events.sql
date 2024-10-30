DROP TABLE EVENTS;

CREATE TABLE EVENTS(
    ID_EVENT INTEGER NOT NULL PRIMARY KEY,
    TITLE VARCHAR2(100) NOT NULL,
    DESCRIPTION VARCHAR2(500) NOT NULL,
    CATEGORIES VARCHAR2(100) NOT NULL,
    STATUS_EVENT VARCHAR2(100) NOT NULL,
    -- 1 para aconteceu, 0 para não aconteceu, null para ainda nÃo ocorrido 
    RESULT_EVENT VARCHAR2(10),
    REGISTER_DATE DATE DEFAULT SYSDATE,
    BETS_FUNDS NUMBER(*, 2) NOT NULL,
    FINISH_DATE VARCHAR2(100) NOT NULL
);

CREATE SEQUENCE SEQ_EVENTS START WITH 1 INCREMENT BY 1;
