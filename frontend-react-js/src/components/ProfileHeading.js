import './ProfileHeading.css';
import EditProfileButton from '../components/EditProfileButton';

import ProfileAvatar from 'components/ProfileAvatar'

export default function ProfileHeading(props) {
    const backgroundImage = 'url("https://wallpaper-mania.com/wp-content/uploads/2018/09/High_resolution_wallpaper_background_ID_77701429855.jpg")';
    const styles = {
        backgroundImage: backgroundImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };
    return (
        <div className='activity_feed_heading profile_heading'>
            <div className='title'>{props.profile.display_name}</div>
            <div className="cruds_count">{props.profile.cruds_count} Cruds</div>
            <div className="banner" style={styles} >
                <ProfileAvatar id={props.profile.cognito_user_uuid} />
            </div>
            <div className="info">
                <div className='id'>
                    <div className="display_name">{props.profile.display_name}</div>
                    <div className="handle">@{props.profile.handle}</div>
                </div>
                <EditProfileButton setPopped={props.setPopped} />
            </div>
            <div className="bio">{props.profile.bio}</div>

        </div>
    );
}