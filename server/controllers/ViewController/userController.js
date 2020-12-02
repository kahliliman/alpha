import bcrypt from 'bcrypt';
import { userGames, userGameBiodata } from '../../models';
import checkUserId from '../../middlewares/authentication/checkUserId';

class userController {
  static getProfile = async (req, res) => {
    const login = checkUserId(req.session);

    try {
      const data = await userGameBiodata.findOne({
        attributes: ['name', 'gender', 'dob', 'status'],
        where: { userId: req.session.userId },
        include: [
          {
            model: userGames,
            attributes: ['userId', 'username', 'email'],
          },
        ],
      })
        .catch((e) => console.log(e));
      return res.render('profile', {
        title: req.session.username, login, data, username: req.session.username,
      });
    } catch {
      return res.render('profile', { title: 'Profile', login, username: req.session.username || '' });
    }
  };

  static getEditProfile = async (req, res) => {
    const login = checkUserId(req.session);

    return res.render('editProfile', {
      title: 'Edit Profile', login, username: req.session.username || '', validateError: '',
    });
  };

  static getChangePassword = (req, res) => {
    const login = checkUserId(req.session);

    return res.render('changePassword', {
      title: 'Change Password', login, username: req.session.username || '', validateError: '',
    });
  };

  static patchEditProfile = async (req, res) => {
    const login = checkUserId(req.session);

    try {
      const { name, status, gender } = req.body;
      let { dob } = req.body;

      if (!dob) dob = null;

      await userGameBiodata.findOne({
        where: { userId: req.session.userId },
      })
        .then((user) => {
          if (name) { user.update({ name }); }
          if (gender) { user.update({ gender }); }
          if (dob) { user.update({ dob }); }
          if (status) { user.update({ status }); }
        })
        .catch((e) => console.log(e));

      return res.redirect('/profile');
    } catch {
      return res.redirect('/profile/edit', { login: false });
    }
  };

  static patchChangePassword = async (req, res) => {
    const login = checkUserId(req.session);

    try {
      const { oldPassword, password } = req.body;

      if (oldPassword === password) {
        return res.render('changePassword', {
          title: 'Change Password', login, username: req.session.username || '', validateError: 'New password should not be the same as old password.',
        });
      }

      // Get user data - required for checking old password
      const user = await userGames.findOne({
        where: { userId: req.session.userId },
      });

      // Check password from username and compare
      // Second option is to pass username.password from the seeder that wasn't generated by bcrypt
      // eslint-disable-next-line max-len
      const validPassword = await bcrypt.compare(oldPassword, user.password) || oldPassword === user.password;
      if (!validPassword) {
        return res.render('changePassword', {
          title: 'Change Password', login, username: req.session.username || '', validateError: 'Password is wrong',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      if (validPassword && password) { await user.update({ password: hashedPassword }); }

      return res.redirect('/profile');
    } catch {
      return res.redirect('/profile/changePassword', { login: false });
    }
  };

  static deleteUser = async (req, res) => {
    // TODO : ADD DELETE CONFIRMATION BOX
    const login = checkUserId(req.session);
    try {
      await userGames.destroy({ where: { userId: req.session.userId } })
        .catch((e) => console.log(e));

      req.session.destroy((err) => {
        if (err) {
          return res.render('index', { title: 'Home', login, username: '' });
        }
        res.clearCookie(process.env.SESSION_NAME);

        return res.redirect('/auth/login');
      });
    } catch {
      return res.redirect('/profile');
    }
  };
}

export default userController;