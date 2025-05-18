from app import create_app

appp = create_app()

if __name__ == '__main__':
    appp.run(host='0.0.0.0', port=5000)
