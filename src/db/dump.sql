DROP TABLE ACCOUNTS;
DROP SEQUENCE SEQ_ACCOUNTS;

CREATE TABLE ACCOUNTS(
    ID INTEGER NOT NULL PRIMARY KEY,
    COMPLETE_NAME VARCHAR2(500) NOT NULL,
    EMAIL VARCHAR2(500) NOT NULL UNIQUE,
    PASSWORD VARCHAR2(64) NOT NULL,
    ROLE NUMBER(1) NOT NULL,
    CREATED_AT DATE DEFAULT SYSDATE
);

CREATE SEQUENCE SEQ_ACCOUNTS START WITH 1 INCREMENT BY 1;

INSERT INTO ACCOUNTS (ID, COMPLETE_NAME, EMAIL, PASSWORD, ROLE)
VALUES( SEQ_ACCOUNTS.NEXTVAL, 'Enzo Garofalo', 'enzo@puc', '12312', 1);

INSERT INTO ACCOUNTS (ID, COMPLETE_NAME, EMAIL, PASSWORD, ROLE)
VALUES( SEQ_ACCOUNTS.NEXTVAL, 'Rogério Medina', 'rogerio@puc', '123123', 1);

COMMIT;

DELETE FROM ACCOUNTS WHERE EMAIL = 'henry@puc';
SELECT * FROM ACCOUNTS;
