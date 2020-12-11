const { getPersons } = require('./identify');

const handleSignin = (db, bcrypt)=> (req, res) =>{
    const { email, password } = req.body;
    if(!email || !password) {
        return res.status(400).json({error: 'Incorrect form submission'});
    }
    db.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then(data => {
        const isValid = bcrypt.compareSync(password, data[0].hash);
        if(isValid){
            return db.select('*').from('users')
                .where('email', '=', email)
                .then(user => {
                  const userBody = user[0];
                  getPersons(userBody.groupid)
                    .then(persons => {
                      userBody.persons = persons;
                      res.json(userBody);
                    })
                    .catch(() => res.status(500).json({
                      error: 'Something went wrong obtaining persons',
                    }))
                })
                .catch(err => {
                  res.status(400).json({
                  error: 'Unable to get User'
                })});
        } else {
            res.status(400).json({
              error: 'Wrong credentials'
            })
        }

    })
    .catch(err => res.status(400).json({
      error: 'Wrong credentials'
    }));
}

module.exports = {
    handleSignin: handleSignin
}
