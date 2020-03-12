const db = require("../models");
const config = require("../config/auth.config");
const User = db.user;
const Role = db.role;

const Op = db.Sequelize.Op;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = (req, res) => {
  User.create({
    username: req.body.username,
    password: bcrypt.hashSync(req.body.password, 8)
  })
  .then(user => {
    console.log("signup");
    if (req.body.roles) {
      Role.findAll({
        where: {
          name: {
            [Op.or]: req.body.roles
          }
        }
      }).then(roles => {
        user.setRoles(roles).then(() => {
          let msgObj = {}
          msgObj.message = user.username + " was registered successfully!";
          res.send(msgObj);
          return;
        });
      });
    } else {
      // user role = 1
      user.setRoles([1]).then(() => {
        let msgObj = {}
        msgObj.message = user.username + " was registered successfully!";
        res.send(msgObj);
        return;
      });
    }
  })
  .catch(err => {
    res.status(500).send({ message: err.message });
    return;
  });
};

exports.checkAuth = (req, res) => {
  User.findOne({
    where: {
      username: req.body.username
    }
  })
  .then(user => {
    if (!user) {
      res.status(404).send({message: username + " not found."});
      return;
    }
    var passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );
    if (!passwordIsValid) {
      res.status(401).send({
        accessToken: null,
        message: "Invalid Password!"
      });
      return;
    }
    var token = jwt.sign({ id: user.id }, config.secret, {
      expiresIn: 86400 // 24 hours
    });
    var authorities = [];
    user.getRoles().then(roles => {
      for (let i = 0; i < roles.length; i++) {
        authorities.push("ROLE_" + roles[i].name.toUpperCase());
      }
      res.status(200).send({
        id: user.id,
        username: user.username,
        roles: authorities,
        accessToken: token
      });
      return;
    });
  })
  .catch(err => {
    res.status(500).send({message: err.message});
    return;
  });
};