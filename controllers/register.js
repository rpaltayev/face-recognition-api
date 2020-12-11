const { v4: uuidv4 } = require('uuid');
const { createGroup } = require('./identify');

const handleRegister = (db, bcrypt)=> (req, res)=> {
    const { email, name, password } = req.body;
    const groupId = uuidv4();
    if(!email || !name || !password) {
        return res.status(400).json({error: 'Incorrect form submission'});
    }
    const hash = bcrypt.hashSync(password);

    createGroup({ name, groupId })
      .then(() => {
        db.transaction(trx => {
          trx.insert({
              hash: hash,
              email: email
          })
          .into('login')
          .returning('email')
          .then(loginemail => {
              return trx('users')
                  .returning('*')
                  .insert({
                      email: loginemail[0],
                      name: name,
                      joined: new Date(),
                      groupid: groupId,
                  })
                  .then(user => {
                      const userBody = user[0]
                      userBody.persons = [];
                      res.json(userBody);
                  })
            })
          .then(trx.commit)
          .catch(trx.rollback)
        })
      .catch(err => {
        res.status(400).json({
          error: 'Unable to Register'
        });
      });
  }).catch(error => res.status(500).json({
    error: 'Something is wrong with face detection API.'
  }));
}


module.exports = {
    handleRegister: handleRegister
}
