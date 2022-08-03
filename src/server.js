/**
 * @license
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, If not, see <https://www.gnu.org/licenses/>.
 */

const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const usersOnline = {};

const io = new Server(process.env.PORT || 80, {
  cors: {
    origin: '*',
    methods: ["GET"]
  }
});

io.on('connection', (socket) => {
  console.log('connection');
  socket.on('showOnline', (name) => {
    if (typeof name !== 'string' || name.length > 50) {
      return;
    }
    socket.name = name;
    usersOnline[socket.id] = socket;

    socket.emit('id', socket.id);

    const user = {
      id: socket.id,
      name: name,
    };
    io.emit('newUserOnline', user);
  });

  socket.on('hideOnline', () => {
    io.emit('userDisconnected', socket.id);

    delete usersOnline[socket.id];
  });

  socket.on('startMeeting', (id) => {
    io.emit('userDisconnected', id);

    const roomName = uuidv4();
    socket.emit('startMeeting', roomName);
    usersOnline[id].emit('startMeeting', roomName);

    socket.disconnect();
    usersOnline[id].disconnect();
  });

  socket.on('disconnect', () => {
    io.emit('userDisconnected', socket.id);

    delete usersOnline[socket.id];
  });

  socket.emit('allUsersOnline', getListedUsers());
});

function getListedUsers() {
  const result = {};
  for (const id in usersOnline) {
    result[id] = {
      id: id,
      name: usersOnline[id].name
    };
  }
  return result;
}
