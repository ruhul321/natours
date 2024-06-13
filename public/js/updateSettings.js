import axios from 'axios';
import { showAlert } from './alerts';

//type is either password or data(name & email)
export const updateSettings = async (data, type) => {
  //   console.log(name, email);
  const url =
    type === 'password'
      ? '/api/v1/users/updateMyPassword'
      : '/api/v1/users/updateMe';
  try {
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });
    if (res.data.status === 'success') {
      showAlert(
        'success',
        `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`,
      );
      //location.reload(true);
    }
  } catch (err) {
    console.log(err);
    showAlert('error', err.response.data.message);
  }
};
