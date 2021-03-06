import { FC } from 'react';
// Components and interfaces
import DisplayUserPhoto from './DisplayUserPhoto';
import DisplayUserProducts from './DisplayUserProducts';
import { ProductSummary } from '../products/DisplayProductsSummary';

export interface User {
  _id: string;
  photo: string;
  name: string;
  role: string;
  addedProducts: ProductSummary[];
}
interface UserItemProps {
  user: User;
}
// Component to render user profile
const UserItem: FC<UserItemProps> = ({
  user: { photo, name, role, addedProducts },
}): JSX.Element => {
  return (
    <div>
      <h1>{name}</h1>
      <DisplayUserPhoto photo={photo}></DisplayUserPhoto>
      <p>Role: {role}</p>
      <DisplayUserProducts addedProducts={addedProducts}></DisplayUserProducts>
    </div>
  );
};

export default UserItem;
