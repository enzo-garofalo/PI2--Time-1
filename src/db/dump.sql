-- SQLBook: Code
DROP TABLE ACCOUNTS;
DROP TABLE EVENTS;
DROP TABLE BETS;
DROP SEQUENCE SEQ_ACCOUNTS;

CREATE TABLE ACCOUNTS(
    ID INTEGER NOT NULL PRIMARY KEY,
    COMPLETE_NAME VARCHAR2(500) NOT NULL,
    EMAIL VARCHAR2(500) NOT NULL UNIQUE,
    PASSWORD VARCHAR2(64) NOT NULL,
    BIRTHDATE VARCHAR2(11) NOT NULL,
    -- 1 para moderador | 0 para usuário comum
    ROLE NUMBER(1) NOT NULL,
    TOKEN VARCHAR2(32) NOT NULL UNIQUE,
    CREATED_AT DATE DEFAULT SYSDATE
);

CREATE TABLE EVENTS_STATUS(
    ID_STATUS INTEGER NOT NULL PRIMARY KEY,
    STATUS_DESCRIPTION VARCHAR2(500) UNIQUE
);

CREATE TABLE EVENTS(
    ID_EVENT INTEGER NOT NULL PRIMARY KEY,
    TITLE VARCHAR(100) NOT NULL,
    DESCRIPTION VARCHAR(500) NOT NULL,
    CATEGORIES VARCHAR(100) NOT NULL,
    STATUS_EVENT INTEGER,
    REGISTER_DATE DATE DEFAULT SYSDATE,
    FINISH_DATE DATE NOT NULL,

    CONSTRAINT FK_STATUS_EVENT FOREIGN KEY (STATUS_EVENT) REFERENCES EVENTS_STATUS(ID_STATUS)

);


CREATE TABLE BETS (
    ID_BET INTEGER NOT NULL,
    BET INTEGER NOT NULL,
    VALUE_BET NUMBER(*,2),
    ID_USER NUMBER(38,0) NOT NULL,
    ID_EVENT NUMBER(38,0) NOT NULL,

    CONSTRAINT PK_ID_BET PRIMARY KEY (ID_BET),
    CONSTRAINT FK_ID_USER FOREIGN KEY (ID_USER) REFERENCES ACCOUNTS (ID),
    CONSTRAINT FK_ID_EVENT FOREIGN KEY (ID_EVENT) REFERENCES EVENTS (ID_EVENT)
);


CREATE TABLE WALLETS(
    ID_WALLET INTEGER NOT NULL,
    BALANCE NUMBER(*,2) NOT NULL,
    CREATED_AT DATE DEFAULT SYSDATE,
    FK_ID_USER INTEGER NOT NULL,

    CONSTRAINT PK_ID_WALLET PRIMARY KEY (ID_WALLET),
    CONSTRAINT FK_ID_USER_WALLET FOREIGN KEY (FK_ID_USER) REFERENCES ACCOUNTS(ID)
);


CREATE TABLE HISTORIC(
    TRANSACTION_ID INTEGER NOT NULL,
    TRANSACTION_TYPE VARCHAR2(50) NOT NULL,
    TRANSACTION_DATE DATE DEFAULT SYSDATE,
    TRANSACTION_VALUE NUMBER(*,2) NOT NULL,
    FK_ID_WALLET INTEGER NOT NULL,

    CONSTRAINT PK_ID_TRANSACTION PRIMARY KEY (TRANSACTION_ID),
    CONSTRAINT FK_ID_WALLET FOREIGN KEY (FK_ID_WALLET) REFERENCES WALLETS (ID_WALLET)
);


-- ADICIONAR TRATAMENTO DE ERRO PARA TOKEN OU EMAIL JÁ ADICIONADOS
CREATE SEQUENCE SEQ_ACCOUNTS START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_EVENTS START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_BETS START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_WALLETS START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_TRANSACTION START WITH 1 INCREMENT BY 1;



INSERT INTO ACCOUNTS (ID, COMPLETE_NAME, EMAIL, PASSWORD, ROLE, TOKEN)
VALUES( 
    SEQ_ACCOUNTS.NEXTVAL, 
    'Enzo Garofalo', 
    'enzo.g@puc', 
    '12312', 
    1, 
    DBMS_RANDOM.STRING('X', 32)
);

INSERT INTO ACCOUNTS (ID, COMPLETE_NAME, EMAIL, PASSWORD, ROLE, TOKEN)
VALUES( 
    SEQ_ACCOUNTS.NEXTVAL, 
    'Rogério Medina', 
    'rogerio@puc', 
    '123123', 
    1, 
    DBMS_RANDOM.STRING('X', 32)
);

COMMIT;

SELECT * FROM ACCOUNTS;
SELECT * FROM BETS;
SELECT * FROM EVENTS;


