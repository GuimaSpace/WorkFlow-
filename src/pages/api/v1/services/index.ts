import type { NextApiRequest, NextApiResponse } from 'next'
import { ServiceInterface } from '@/models'
import { ValidateServiceForm } from '@/services/validate.service';
import { db, addDoc, collection, getDocs, doc, getDoc, updateDoc } from '@/services/firebaseClient.service';
import { DocumentData } from 'firebase/firestore';
import { serviceController } from '@/controller';

const PAGE_SIZE = 10; /* Máximo de objetos que irão retornar em cada página */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const FormData = req.body
      const TrustedData = await ValidateServiceForm(FormData) as ServiceInterface
      await serviceController.addService(TrustedData);
      res.status(200).json({ message: "Serviço cadastrado com sucesso" });
      return;
    } catch (error) {
      res.status(405).json({ Error: "" + error });
      return;
    }
  }

  if (req.method === 'GET') {
    try {
      const page = Number(req.query.page) || 10;
      const limit = Number(req.query.limit) || PAGE_SIZE;
      const offset = (page - 1) * limit;

      const querySnapshot = await getDocs(collection(db, 'services'));
      const servicesData: DocumentData[] = [];

      querySnapshot.forEach((doc) => {
        const service = doc.data();
        service.id = doc.id;
        servicesData.push(service);
      });

      const total = servicesData.length;
      const totalPages = Math.ceil(total / limit);

      const paginatedServicesData = servicesData.slice(offset, offset + limit);

      res.status(201).json({
        data: paginatedServicesData,
        page,
        limit,
        total,
        totalPages,
      });

      return;
    } catch (error) {
      res.status(500).json({ Error: '' + error });
      return;
    }
  }

  if (req.method === 'PATCH') {
    interface bodyService {
      id: string,
      status: 0 | 1 | 2;
    }
    const body: bodyService = req.body;

    if (body.id == null && body.id == "") {
      res.status(400).json({ message: "Parametros estão vazios."})
      return;
    }

    if (body.status == null && body.status == "") {
      res.status(400).json({ message: "Parametros estão vazios."})
      return;
    }                                                                                         
    serviceController.serviceStatus(body).then((status) => {
      res.status(200).json({ message: "Serviço atualizado com sucesso!"})
    }).catch((error) => {
      res.status(400).json({ message: "Ocorreu um erro ao atualizar o serviço", reason: `${error}`})
    })
    return;
  }

  res.status(400).json({ message: "The specified method is not accepted" });
}
