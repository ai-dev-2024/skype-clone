import { User } from '../../src/models/User';

describe('User Model', () => {
  describe('User creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword123',
        firstName: 'Test',
        lastName: 'User'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.firstName).toBe(userData.firstName);
      expect(savedUser.lastName).toBe(userData.lastName);
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should fail to create user with duplicate email', async () => {
      const userData1 = {
        username: 'testuser1',
        email: 'duplicate@example.com',
        password: 'hashedpassword123',
        firstName: 'Test1',
        lastName: 'User1'
      };

      const userData2 = {
        username: 'testuser2',
        email: 'duplicate@example.com',
        password: 'hashedpassword456',
        firstName: 'Test2',
        lastName: 'User2'
      };

      await new User(userData1).save();

      await expect(new User(userData2).save()).rejects.toThrow();
    });

    it('should fail to create user with duplicate username', async () => {
      const userData1 = {
        username: 'duplicateuser',
        email: 'test1@example.com',
        password: 'hashedpassword123',
        firstName: 'Test1',
        lastName: 'User1'
      };

      const userData2 = {
        username: 'duplicateuser',
        email: 'test2@example.com',
        password: 'hashedpassword456',
        firstName: 'Test2',
        lastName: 'User2'
      };

      await new User(userData1).save();

      await expect(new User(userData2).save()).rejects.toThrow();
    });
  });

  describe('User validation', () => {
    it('should require username', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashedpassword123',
        firstName: 'Test',
        lastName: 'User'
      };

      const user = new User(userData);

      await expect(user.save()).rejects.toThrow();
    });

    it('should require email', async () => {
      const userData = {
        username: 'testuser',
        password: 'hashedpassword123',
        firstName: 'Test',
        lastName: 'User'
      };

      const user = new User(userData);

      await expect(user.save()).rejects.toThrow();
    });

    it('should require password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      const user = new User(userData);

      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('User status', () => {
    it('should default status to online', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword123',
        firstName: 'Test',
        lastName: 'User'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.status).toBe('online');
    });
  });
});
